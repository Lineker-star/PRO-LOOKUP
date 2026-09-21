<?php

namespace App\Http\Controllers;

use App\Models\Connection;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ConnectionController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        $connections = Connection::with(['requester.rank', 'addressee.rank'])
            ->where('requester_id', $userId)
            ->orWhere('addressee_id', $userId)
            ->latest()
            ->get();

        return response()->json($connections);
    }

    public function store(Request $request, User $user)
    {
        $requester = $request->user();
        if ($requester->id === $user->id || $user->status !== 'approved' || $requester->status !== 'approved') {
            return response()->json(['message' => 'Cette mise en relation n’est pas disponible.'], 422);
        }

        $validator = validator($request->all(), ['note' => ['nullable', 'string', 'max:500']]);
        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        $connection = Connection::firstOrCreate(
            ['requester_id' => $requester->id, 'addressee_id' => $user->id],
            ['note' => $request->input('note'), 'status' => 'pending']
        );

        Notification::create([
            'user_id' => $user->id,
            'type' => 'connection_request',
            'data' => ['connection_id' => $connection->id, 'from' => $requester->full_name],
        ]);

        return response()->json($connection->load(['requester.rank', 'addressee.rank']), 201);
    }

    public function update(Request $request, Connection $connection)
    {
        if ($connection->addressee_id !== $request->user()->id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $status = $request->input('status');
        if (! in_array($status, ['accepted', 'declined'], true)) {
            throw ValidationException::withMessages(['status' => ['Statut invalide.']]);
        }

        $connection->update(['status' => $status]);
        Notification::create([
            'user_id' => $connection->requester_id,
            'type' => 'connection_updated',
            'data' => ['connection_id' => $connection->id, 'status' => $status],
        ]);

        return response()->json($connection->fresh(['requester.rank', 'addressee.rank']));
    }
}