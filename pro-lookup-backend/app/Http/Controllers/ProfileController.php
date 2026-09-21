<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Rank;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));
        $department = trim((string) $request->query('department', ''));
        $rank = trim((string) $request->query('rank', ''));

        $query = User::query()
            ->with('rank')
            ->where('status', 'approved')
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($sub) use ($search) {
                    $sub->where('first_name', 'like', '%'.$search.'%')
                        ->orWhere('last_name', 'like', '%'.$search.'%')
                        ->orWhere('department', 'like', '%'.$search.'%');
                });
            })
            ->when($department !== '', function ($query) use ($department) {
                $query->where('department', 'like', '%'.$department.'%');
            })
            ->when($rank !== '', function ($query) use ($rank) {
                $query->whereHas('rank', fn ($rankQuery) => $rankQuery
                    ->where('slug', $rank)
                    ->orWhere('id', $rank));
            })
            ->orderBy('last_name');

        $columns = [
                'id',
                'first_name',
                'last_name',
                'department',
                'bio',
                'status',
                'slug',
                'avatar_path',
                'rank_id',
            ];

        $users = $request->has('per_page')
            ? $query->paginate((int) $request->query('per_page', 12), $columns)
            : $query->get($columns);

        return response()->json($users);
    }

    public function show(string $slug)
    {
        $user = User::query()
            ->with(['rank', 'posts' => fn ($query) => $query->latest()->withCount(['comments', 'likes'])])
            ->where('slug', $slug)
            ->where('status', 'approved')
            ->firstOrFail();

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'department' => $user->department,
            'bio' => $user->bio,
            'slug' => $user->slug,
            'avatar_path' => $user->avatar_path,
            'rank' => $user->rank,
            'posts' => $user->posts,
        ]);
    }

    public function ranks()
    {
        return response()->json(Rank::query()->orderBy('order')->orderBy('name')->get());
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'first_name' => $request->user()->first_name,
                'last_name' => $request->user()->last_name,
                'email' => $request->user()->email,
                'department' => $request->user()->department,
                'bio' => $request->user()->bio,
                'status' => $request->user()->status,
                'role' => $request->user()->role,
                'slug' => $request->user()->slug,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'first_name' => ['sometimes', 'required', 'string', 'max:255'],
            'last_name' => ['sometimes', 'required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        $data = $request->only(['first_name', 'last_name', 'department', 'bio']);

        if (isset($data['first_name']) || isset($data['last_name'])) {
            $firstName = $data['first_name'] ?? $user->first_name;
            $lastName = $data['last_name'] ?? $user->last_name;
            $data['slug'] = $this->generateUniqueSlug($firstName, $lastName, $user->id);
        }

        $user->fill($data);
        $user->save();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'department' => $user->department,
                'bio' => $user->bio,
                'status' => $user->status,
                'role' => $user->role,
                'slug' => $user->slug,
            ],
        ]);
    }

    public function pending(Request $request)
    {
        if (! $request->user() || $request->user()->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $users = User::where('status', 'pending')->get();

        return response()->json($users);
    }

    public function approve(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $user->status = 'approved';
        $user->approved_by = $request->user()->id;
        $user->approved_at = now();
        $user->rejection_reason = null;
        $user->save();

        Notification::create([
            'user_id' => $user->id,
            'type' => 'profile_approved',
            'data' => ['message' => 'Votre profil est maintenant visible dans l’annuaire.'],
        ]);

        return response()->json([
            'message' => 'Profil approuvé avec succès.',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'status' => $user->status,
                'approved_by' => $user->approved_by,
            ],
        ]);
    }

    public function reject(Request $request, User $user)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reason' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        $user->status = 'rejected';
        $user->rejection_reason = $request->input('reason');
        $user->save();

        return response()->json([
            'message' => 'Profil rejeté.',
            'user' => [
                'id' => $user->id,
                'status' => $user->status,
            ],
        ]);
    }

    protected function generateUniqueSlug(string $firstName, string $lastName, ?int $ignoreUserId = null): string
    {
        $base = strtolower(trim($firstName.'-'.$lastName));
        $base = preg_replace('/[^a-z0-9]+/', '-', $base);
        $base = trim($base, '-');

        if ($base === '') {
            $base = 'member';
        }

        $slug = $base;
        $counter = 1;

        while (User::where('slug', $slug)
            ->when($ignoreUserId, fn ($query) => $query->where('id', '!=', $ignoreUserId))
            ->exists()) {
            $slug = $base.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
