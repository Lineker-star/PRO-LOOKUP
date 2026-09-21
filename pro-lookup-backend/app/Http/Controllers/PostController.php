<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Like;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $posts = Post::query()
            ->with(['user.rank', 'comments.user', 'likes'])
            ->whereHas('user', fn ($query) => $query->where('status', 'approved'))
            ->where(function ($query) use ($user) {
                $query->where('visibility', 'public')
                    ->orWhere(function ($sub) use ($user) {
                        $sub->where('visibility', 'connections')
                            ->where('user_id', $user?->id ?? 0);
                    });
            })
            ->latest()
            ->get();

        return response()->json([
            'posts' => $posts->map(function ($post) {
                return [
                    'id' => $post->id,
                    'user_id' => $post->user_id,
                    'author' => [
                        'id' => $post->user->id,
                        'first_name' => $post->user->first_name,
                        'last_name' => $post->user->last_name,
                        'slug' => $post->user->slug,
                        'rank' => $post->user->rank,
                    ],
                    'content' => $post->content,
                    'visibility' => $post->visibility,
                    'comments_count' => $post->comments->count(),
                    'likes_count' => $post->likes->count(),
                    'created_at' => $post->created_at,
                ];
            }),
        ]);
    }

    public function store(Request $request)
    {
        $user = $request->user();

        if ($user->status !== 'approved') {
            return response()->json(['message' => 'Votre compte doit être approuvé pour publier.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => ['required', 'string', 'max:2000'],
            'image' => ['nullable', 'image', 'max:5120'],
            'visibility' => ['sometimes', 'in:public,connections'],
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store('posts', 'public')
            : null;

        $post = Post::create([
            'user_id' => $user->id,
            'content' => $request->content,
            'image_path' => $imagePath,
            'visibility' => $request->visibility ?? 'public',
        ]);

        return response()->json([
            'message' => 'Publication créée avec succès.',
            'post' => [
                'id' => $post->id,
                'user_id' => $post->user_id,
                'content' => $post->content,
                'visibility' => $post->visibility,
            ],
        ], 201);
    }

    public function addComment(Request $request, Post $post)
    {
        $user = $request->user();

        if ($user->status !== 'approved') {
            return response()->json(['message' => 'Votre compte doit être approuvé pour commenter.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'content' => ['required', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        $comment = Comment::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
            'content' => $request->content,
        ]);

        return response()->json([
            'message' => 'Commentaire ajouté.',
            'comment' => [
                'id' => $comment->id,
                'post_id' => $comment->post_id,
                'user_id' => $comment->user_id,
                'content' => $comment->content,
            ],
        ], 201);
    }

    public function like(Request $request, Post $post)
    {
        $user = $request->user();

        if ($user->status !== 'approved') {
            return response()->json(['message' => 'Votre compte doit être approuvé pour aimer une publication.'], 403);
        }

        $alreadyLiked = Like::where('post_id', $post->id)
            ->where('user_id', $user->id)
            ->exists();

        if ($alreadyLiked) {
            return response()->json(['message' => 'Vous avez déjà aimé cette publication.'], 409);
        }

        $like = Like::create([
            'post_id' => $post->id,
            'user_id' => $user->id,
        ]);

        return response()->json([
            'liked' => true,
            'like' => [
                'id' => $like->id,
                'post_id' => $like->post_id,
                'user_id' => $like->user_id,
            ],
        ]);
    }
}
