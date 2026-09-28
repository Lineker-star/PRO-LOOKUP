<?php

use App\Http\Controllers\Api\V1\Admin\AuditController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\PostController as AdminPostController;
use App\Http\Controllers\Api\V1\Admin\ReferenceController;
use App\Http\Controllers\Api\V1\Admin\RegistrationController;
use App\Http\Controllers\Api\V1\Admin\ReportController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\MeController;
use App\Http\Controllers\Api\V1\MyPostController;
use App\Http\Controllers\Api\V1\PublicController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API PRO-LOOKUP v1 (brief §9.4)
|--------------------------------------------------------------------------
| Quatre groupes alignés sur les zones d'accès :
|   public · enseignant (tout statut) · enseignant approuvé · administrateur.
| Les anciennes routes non versionnées (réseau social) sont conservées dans
| routes/api_legacy.php mais ne sont plus chargées (voir DECISIONS.md).
*/

Route::get('/ping', fn () => response()->json(['status' => 'ok']));

Route::prefix('v1')->group(function () {

    // ------------------------------------------------------------ Public (zone A)
    Route::prefix('public')->group(function () {
        Route::get('/teachers', [PublicController::class, 'teachers']);
        Route::get('/teachers/{slug}', [PublicController::class, 'teacher']);
        Route::get('/teachers/{slug}/posts', [PublicController::class, 'teacherPosts']);
        Route::get('/teachers/{slug}/cv', [PublicController::class, 'teacherCv'])->middleware('throttle:60,1');
        Route::get('/posts', [PublicController::class, 'posts']);
        Route::get('/posts/{id}', [PublicController::class, 'post'])->whereNumber('id');
        Route::get('/search', [PublicController::class, 'search']);
        Route::get('/stats', [PublicController::class, 'stats']);
        Route::get('/schools', [PublicController::class, 'schools']);
        Route::get('/suggestions', [PublicController::class, 'suggestions']);
        Route::get('/grades', [PublicController::class, 'grades']);
        Route::get('/categories', [PublicController::class, 'categories']);
        Route::get('/sitemap', [PublicController::class, 'sitemap']);
        Route::post('/reports', [PublicController::class, 'report'])->middleware('throttle:reports');
    });

    // ------------------------------------------------------------ Authentification
    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:register');
        Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
        Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:password');
        Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:password');
        Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
    });

    // ------------------------------------------------------------ Enseignant, tout statut (zone B)
    Route::middleware('auth:sanctum')->prefix('me')->group(function () {
        Route::get('/', [MeController::class, 'show']);
        Route::get('/status', [MeController::class, 'status']);
        Route::put('/profile', [MeController::class, 'update']);
        Route::post('/images/{kind}', [MeController::class, 'uploadImage']);
        Route::delete('/images/{kind}', [MeController::class, 'deleteImage']);
        Route::get('/cv', [MeController::class, 'downloadCv']);
        Route::post('/cv', [MeController::class, 'uploadCv']);
        Route::delete('/cv', [MeController::class, 'deleteCv']);
        Route::post('/profile-items', [MeController::class, 'storeItem']);
        Route::put('/profile-items/{item}', [MeController::class, 'updateItem']);
        Route::delete('/profile-items/{item}', [MeController::class, 'destroyItem']);
        Route::post('/registration', [MeController::class, 'resubmit']);
        Route::put('/password', [MeController::class, 'updatePassword']);
        Route::get('/sessions', [MeController::class, 'sessions']);
        Route::delete('/sessions/{id}', [MeController::class, 'revokeSession'])->whereNumber('id');
        Route::delete('/sessions', [MeController::class, 'revokeOtherSessions']);

        // -------------------------------------------------------- Enseignant approuvé
        Route::middleware('approved')->group(function () {
            Route::get('/posts', [MyPostController::class, 'index']);
            Route::post('/posts', [MyPostController::class, 'store']);
            Route::get('/posts/{id}', [MyPostController::class, 'show'])->whereNumber('id');
            Route::put('/posts/{id}', [MyPostController::class, 'update'])->whereNumber('id');
            Route::delete('/posts/{id}', [MyPostController::class, 'destroy'])->whereNumber('id');
            Route::post('/posts/{id}/media', [MyPostController::class, 'uploadMedia'])->whereNumber('id');
            Route::put('/posts/{id}/media/{mediaId}', [MyPostController::class, 'updateMedia'])->whereNumber(['id', 'mediaId']);
            Route::delete('/posts/{id}/media/{mediaId}', [MyPostController::class, 'destroyMedia'])->whereNumber(['id', 'mediaId']);
            Route::get('/public-profile', [MeController::class, 'publicProfile']);
            Route::put('/public-profile', [MeController::class, 'updatePublicProfile']);
            Route::get('/slug/availability', [MeController::class, 'slugAvailability']);
            Route::put('/slug', [MeController::class, 'updateSlug']);
            Route::put('/settings', [MeController::class, 'settings']);
        });
    });

    // ------------------------------------------------------------ Administration (zone C)
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        Route::get('/dashboard', DashboardController::class);

        Route::get('/registration-requests', [RegistrationController::class, 'index']);
        Route::get('/registration-requests/{registration}', [RegistrationController::class, 'show']);
        Route::get('/registration-requests/{registration}/document', [RegistrationController::class, 'document']);
        Route::post('/registration-requests/{registration}/approve', [RegistrationController::class, 'approve']);
        Route::post('/registration-requests/{registration}/reject', [RegistrationController::class, 'reject']);

        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show'])->whereNumber('id');
        // Pas de modification des informations ou du profil d'un enseignant par l'administration.
        Route::post('/users/{id}/suspend', [UserController::class, 'suspend'])->whereNumber('id');
        Route::post('/users/{id}/reactivate', [UserController::class, 'reactivate'])->whereNumber('id');
        Route::post('/users/{id}/promote', [UserController::class, 'promote'])->whereNumber('id');
        Route::post('/users/{id}/demote', [UserController::class, 'demote'])->whereNumber('id');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->whereNumber('id');

        Route::get('/posts', [AdminPostController::class, 'index']);
        Route::get('/posts/{id}', [AdminPostController::class, 'show'])->whereNumber('id');
        Route::post('/posts/{id}/hide', [AdminPostController::class, 'hide'])->whereNumber('id');
        Route::post('/posts/{id}/restore', [AdminPostController::class, 'restore'])->whereNumber('id');
        Route::delete('/posts/{id}', [AdminPostController::class, 'destroy'])->whereNumber('id');

        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/{report}', [ReportController::class, 'show']);
        Route::post('/reports/{report}/resolve', [ReportController::class, 'resolve']);

        Route::get('/references', [ReferenceController::class, 'index']);
        Route::post('/references/{type}', [ReferenceController::class, 'store'])->whereIn('type', ['grades', 'categories', 'schools']);
        Route::put('/references/{type}/{id}', [ReferenceController::class, 'update'])->whereIn('type', ['grades', 'categories', 'schools'])->whereNumber('id');
        Route::delete('/references/{type}/{id}', [ReferenceController::class, 'destroy'])->whereIn('type', ['grades', 'categories', 'schools'])->whereNumber('id');

        Route::get('/audit-log', [AuditController::class, 'index']);
    });
});
