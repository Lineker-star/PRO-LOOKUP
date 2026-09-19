<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', function () {
    return response()->json(['status' => 'ok']);
});

Route::get('/profiles', [ProfileController::class, 'index']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/profile/me', [ProfileController::class, 'me']);
    Route::put('/profile/me', [ProfileController::class, 'update']);

    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/{post}/comments', [PostController::class, 'addComment']);
    Route::post('/posts/{post}/like', [PostController::class, 'like']);

    Route::post('/admin/users/{user}/approve', [ProfileController::class, 'approve']);
    Route::post('/admin/users/{user}/reject', [ProfileController::class, 'reject']);
    Route::get('/admin/users/pending', [ProfileController::class, 'pending']);
});
