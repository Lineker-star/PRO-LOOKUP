<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\V1\PostRequest;
use App\Http\Resources\V1\PostResource;
use App\Models\Post;
use App\Models\PostMedia;
use App\Services\FrontendRevalidator;
use App\Services\HtmlSanitizer;
use App\Services\ImageStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Publications de l'enseignant connecté (brief §7.3). Réservé aux comptes approuvés.
 * Un enseignant ne peut voir et modifier QUE ses propres publications.
 */
class MyPostController extends Controller
{
    public function __construct(
        private HtmlSanitizer $sanitizer,
        private FrontendRevalidator $revalidator,
    ) {
    }

    /** Retrouve une publication de l'utilisateur connecté, sinon 404 (sans révéler qu'elle existe). */
    private function ownPost(Request $request, int $id): Post
    {
        return Post::where('user_id', $request->user()->id)->with(['category', 'media', 'user'])->findOrFail($id);
    }

    private function present(Post $post): array
    {
        return PostResource::forAudience($post->fresh(['category', 'media', 'user.rank', 'user.faculty', 'user.departmentRef']), 'owner')->resolve();
    }

    public function index(Request $request): JsonResponse
    {
        $base = Post::where('user_id', $request->user()->id);
        $status = $request->query('status');

        $posts = (clone $base)
            ->when(in_array($status, ['draft', 'published', 'hidden'], true), fn ($q) => $q->where('status', $status))
            ->with(['category', 'media', 'user.rank', 'user.faculty', 'user.departmentRef'])
            ->latest('updated_at')
            ->paginate(min((int) $request->query('per_page', 20), 50));

        return response()->json([
            'data' => $posts->getCollection()->map(fn ($p) => PostResource::forAudience($p, 'owner')->resolve()),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
            'counts' => [
                'all' => (clone $base)->count(),
                'draft' => (clone $base)->where('status', 'draft')->count(),
                'published' => (clone $base)->where('status', 'published')->count(),
                'hidden' => (clone $base)->where('status', 'hidden')->count(),
            ],
        ]);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json(['data' => $this->present($this->ownPost($request, $id))]);
    }

    public function store(PostRequest $request): JsonResponse
    {
        $data = $request->validated();

        $post = new Post([
            'title' => $data['title'] ?? null,
            'content' => $this->sanitizer->clean($data['content']),
            'category_id' => $data['category_id'],
            'status' => $data['status'],
        ]);
        $post->user_id = $request->user()->id;
        $post->visibility = 'public';
        $post->published_at = $data['status'] === 'published' ? now() : null;
        $post->save();

        $this->syncLink($post, $data['link_url'] ?? null);

        if ($post->status === 'published') {
            $this->revalidator->post($post->id, $request->user()->slug);
        }

        return response()->json([
            'data' => $this->present($post),
            'message' => $post->status === 'published' ? 'Publication mise en ligne.' : 'Brouillon enregistré.',
        ], 201);
    }

    public function update(PostRequest $request, int $id): JsonResponse
    {
        $post = $this->ownPost($request, $id);
        $data = $request->validated();
        $wasPublished = $post->status === PostStatus::Published->value;

        $post->fill([
            'title' => $data['title'] ?? null,
            'content' => $this->sanitizer->clean($data['content']),
            'category_id' => $data['category_id'],
        ]);

        // Une publication masquée par l'administration le reste : l'auteur peut la corriger,
        // mais seul un administrateur peut la rétablir.
        if ($post->status !== PostStatus::Hidden->value) {
            $post->status = $data['status'];
            if ($data['status'] === 'published' && ! $post->published_at) {
                $post->published_at = now();
            }
        }
        if ($wasPublished && $post->isDirty(['title', 'content', 'category_id'])) {
            $post->edited_at = now();
        }
        $post->save();

        if (array_key_exists('link_url', $data)) {
            $this->syncLink($post, $data['link_url']);
        }

        $this->revalidator->post($post->id, $request->user()->slug);

        return response()->json(['data' => $this->present($post), 'message' => 'Publication enregistrée.']);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $post = $this->ownPost($request, $id);
        foreach ($post->media as $media) {
            if ($media->path) {
                Storage::disk('public')->delete($media->path);
            }
        }
        $post->delete();
        $this->revalidator->post($id, $request->user()->slug);

        return response()->json(['message' => 'Publication supprimée.']);
    }

    /**
     * Ajout de médias : jusqu'à 10 images, OU un document PDF (brief §7.2).
     * Les images sont redimensionnées et débarrassées de leurs métadonnées.
     */
    public function uploadMedia(Request $request, ImageStore $images, int $id): JsonResponse
    {
        $post = $this->ownPost($request, $id);
        $request->validate([
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,pdf', 'max:10240'],
            'alts' => ['sometimes', 'array'],
            'alts.*' => ['nullable', 'string', 'max:255'],
        ]);

        $files = $request->file('files');
        $pdfs = array_filter($files, fn ($f) => strtolower($f->getClientOriginalExtension()) === 'pdf');
        $existingImages = $post->media->where('type', 'image')->count();
        $existingPdf = $post->media->where('type', 'pdf')->count();

        if ($pdfs && (count($files) > 1 || $existingImages || $existingPdf)) {
            return response()->json(['message' => 'Une publication contient soit des images, soit un seul document PDF.'], 422);
        }
        if (! $pdfs && ($existingPdf || $existingImages + count($files) > 10)) {
            return response()->json(['message' => 'Une publication peut contenir au maximum 10 images, sans document PDF.'], 422);
        }

        // Des médias remplacent un éventuel lien externe.
        $post->media()->where('type', 'link')->delete();

        $position = (int) $post->media()->max('position');
        foreach ($files as $index => $file) {
            $isPdf = strtolower($file->getClientOriginalExtension()) === 'pdf';
            PostMedia::create([
                'post_id' => $post->id,
                'type' => $isPdf ? 'pdf' : 'image',
                'path' => $isPdf ? $file->store('posts/documents', 'public') : $images->store($file, 'posts/images'),
                'alt' => $request->input("alts.{$index}"),
                'original_name' => $file->getClientOriginalName(),
                'size' => $file->getSize(),
                'position' => ++$position,
            ]);
        }

        $this->revalidator->post($post->id, $request->user()->slug);

        return response()->json(['data' => $this->present($post)], 201);
    }

    public function updateMedia(Request $request, int $id, int $mediaId): JsonResponse
    {
        $post = $this->ownPost($request, $id);
        $data = $request->validate(['alt' => ['nullable', 'string', 'max:255'], 'position' => ['sometimes', 'integer', 'min:0']]);
        $post->media()->whereKey($mediaId)->firstOrFail()->update($data);

        return response()->json(['data' => $this->present($post)]);
    }

    public function destroyMedia(Request $request, int $id, int $mediaId): JsonResponse
    {
        $post = $this->ownPost($request, $id);
        $media = $post->media()->whereKey($mediaId)->firstOrFail();
        if ($media->path) {
            Storage::disk('public')->delete($media->path);
        }
        $media->delete();
        $this->revalidator->post($post->id, $request->user()->slug);

        return response()->json(['data' => $this->present($post)]);
    }

    /** Lien externe : exclusif avec les images et le PDF. */
    private function syncLink(Post $post, ?string $url): void
    {
        $post->media()->where('type', 'link')->delete();
        if ($url && ! $post->media()->exists()) {
            PostMedia::create(['post_id' => $post->id, 'type' => 'link', 'url' => $url, 'position' => 0]);
        }
    }
}
