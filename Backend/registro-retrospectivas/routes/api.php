<?php

use App\Http\Controllers\RetrospectivaController;
use Illuminate\Support\Facades\Route;

Route::get('/sprints', [RetrospectivaController::class, 'index']);
Route::post('/sprints', [RetrospectivaController::class, 'store']);
Route::get('/sprints/{id}', [RetrospectivaController::class, 'show']);

Route::post('/sprints/{sprintId}/items', [RetrospectivaController::class, 'storeItem']);
Route::put('/items/{itemId}', [RetrospectivaController::class, 'updateItem']);
Route::delete('/items/{itemId}', [RetrospectivaController::class, 'destroyItem']);