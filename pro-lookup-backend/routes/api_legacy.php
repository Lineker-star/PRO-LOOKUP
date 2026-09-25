<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ConnectionController;
use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/profiles', [ProfileController::class, 'index']);
Route::get('/profiles/{slug}', [ProfileController::class, 'show']);
Route::get('/ranks', [ProfileController::class, 'ranks']);
Route::get('/posts', [PostController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile/me', [ProfileController::class, 'me']);
    Route::put('/profile/me', [ProfileController::class, 'update']);

    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/{post}/comments', [PostController::class, 'addComment']);
    Route::post('/posts/{post}/like', [PostController::class, 'like']);

    Route::get('/connections', [ConnectionController::class, 'index']);
    Route::post('/connections/{user}', [ConnectionController::class, 'store']);
    Route::patch('/connections/{connection}', [ConnectionController::class, 'update']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'read']);
    Route::post('/notifications/read-all', [NotificationController::class, 'readAll']);

    Route::post('/admin/users/{user}/approve', [ProfileController::class, 'approve']);
    Route::post('/admin/users/{user}/reject', [ProfileController::class, 'reject']);
    Route::get('/admin/users/pending', [ProfileController::class, 'pending']);
});
