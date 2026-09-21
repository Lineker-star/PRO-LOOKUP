<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'notifications' => Notification::where('user_id', $request->user()->id)->latest()->paginate(20),
            'unread_count' => Notification::where('user_id', $request->user()->id)->whereNull('read_at')->count(),
        ]);
    }

    public function read(Request $request, Notification $notification)
    {
        abort_unless($notification->user_id === $request->user()->id, 403);
        $notification->update(['read_at' => now()]);
        return response()->json(['message' => 'Notification marquée comme lue.']);
    }

    public function readAll(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->whereNull('read_at')->update(['read_at' => now()]);
        return response()->json(['message' => 'Notifications marquées comme lues.']);
    }
}