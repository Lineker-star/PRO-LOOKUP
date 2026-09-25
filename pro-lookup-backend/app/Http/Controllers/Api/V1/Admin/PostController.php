<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PostStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\V1\PostResource;
use App\Models\Post;
use App\Services\AuditLogger;
use App\Services\FrontendRevalidator;
use App\Support\Emails;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** Modération des publications : masquer (motif obligatoire), rétablir, supprimer. */
class PostController extends Controller
{
    public function __construct(private AuditLogger $audit, private FrontendRevalidator $revalidator)
    {
    }

    private function present(Post $post): array
    {
        return PostResource::forAudience($post->loadMissing(['category', 'media', 'user.rank', 'user.faculty', 'user.departmentRef']), 'admin')->resolve();
    }

    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status');
        $search = trim((string) $request->query('q', ''));

        $posts = Post::query()
            // Les brouillons sont privés : l'administration ne les voit pas (brief §6.2).
            ->where('status', '!=', PostStatus::Draft->value)
            ->when(in_array($status, ['published', 'hidden'], true), fn ($q) => $q->where('status', $status))
            ->when($request->filled('category'), fn ($q) => $q->where('category_id', $request->query('category')))
            ->when($request->filled('author'), fn ($q) => $q->where('user_id', $request->query('author')))
            ->when($search !== '', fn ($q) => $q->where(function ($sub) use ($search) {
                $term = '%'.mb_strtolower($search).'%';
                $sub->whereRaw('LOWER(COALESCE(title, \'\')) LIKE ?', [$term])->orWhereRaw('LOWER(content) LIKE ?', [$term]);
            }))
            ->with(['category', 'media', 'user.rank', 'user.faculty', 'user.departmentRef'])
            ->latest('published_at')
            ->paginate(20);

        return response()->json([
            'data' => $posts->getCollection()->map(fn ($p) => $this->present($p)),
            'meta' => ['current_page' => $posts->currentPage(), 'last_page' => $posts->lastPage(), 'total' => $posts->total()],
            'counts' => [
                'published' => Post::where('status', 'published')->count(),
                'hidden' => Post::where('status', 'hidden')->count(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $post = Post::where('status', '!=', PostStatus::Draft->value)->findOrFail($id);

        return response()->json(['data' => $this->present($post)]);
    }

    public function hide(Request $request, int $id): JsonResponse
    {
        $post = Post::with('user')->where('status', PostStatus::Published->value)->findOrFail($id);
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']], [
            'reason.required' => 'Le motif du masquage est obligatoire.',
        ]);

        self::applyHide($post, $data['reason']);
        $this->audit->log($request->user(), 'post.hidden', $post, $data['reason']);
        Emails::postHidden($post, $data['reason']);
        $this->revalidator->post($post->id, $post->user?->slug);

        return response()->json(['message' => 'Publication masquée. L’auteur a été prévenu.', 'data' => $this->present($post)]);
    }

    public static function applyHide(Post $post, string $reason): void
    {
        $post->status = PostStatus::Hidden->value;
        $post->hidden_reason = $reason;
        $post->save();
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $post = Post::with('user')->where('status', PostStatus::Hidden->value)->findOrFail($id);
        $post->status = PostStatus::Published->value;
        $post->hidden_reason = null;
        $post->save();

        $this->audit->log($request->user(), 'post.restored', $post);
        $this->revalidator->post($post->id, $post->user?->slug);

        return response()->json(['message' => 'Publication rétablie.', 'data' => $this->present($post)]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $post = Post::with(['user', 'media'])->where('status', '!=', PostStatus::Draft->value)->findOrFail($id);
        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:1000']]);

        $this->audit->log($request->user(), 'post.deleted', $post, $data['reason']);
        foreach ($post->media as $media) {
            if ($media->path) {
                Storage::disk('public')->delete($media->path);
            }
        }
        $slug = $post->user?->slug;
        $post->delete();
        $this->revalidator->post($id, $slug);

        return response()->json(['message' => 'Publication supprimée définitivement.']);
    }
}
