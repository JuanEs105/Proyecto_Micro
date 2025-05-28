<?php

namespace App\Http\Controllers;

use App\Models\Sprint;
use App\Models\RetroItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RetrospectivaController extends Controller
{
    /**
     * Obtener todos los sprints con sus items (paginados)
     */
    public function index()
    {
        try {
            $sprints = Sprint::with('retroItems')->paginate(10);
            
            return response()->json([
                'success' => true,
                'data' => $sprints,
                'message' => 'Sprints obtenidos exitosamente'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error al obtener sprints: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Crear un nuevo sprint
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'nombre' => 'required|string|max:100',
                'fecha_inicio' => 'required|date|date_format:Y-m-d',
                'fecha_fin' => 'required|date|date_format:Y-m-d|after:fecha_inicio'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                    'message' => 'Error de validación'
                ], 422);
            }

            $sprint = Sprint::create($request->only(['nombre', 'fecha_inicio', 'fecha_fin']));
            
            return response()->json([
                'success' => true,
                'data' => $sprint,
                'message' => 'Sprint creado exitosamente'
            ], 201);

        } catch (\Exception $e) {
            Log::error('Error al crear sprint: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Mostrar un sprint específico
     */
    public function show(string $id)
    {
        try {
            $sprint = Sprint::with('retroItems')->find($id);
            
            if (!$sprint) {
                return $this->notFoundResponse('Sprint no encontrado');
            }
            
            return response()->json([
                'success' => true,
                'data' => $sprint,
                'message' => 'Sprint obtenido exitosamente'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error al obtener sprint: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Agregar item a retrospectiva (mejorado)
     */
    public function storeItem(Request $request, string $sprintId)
    {
        try {
            // Verificar existencia del sprint
            $sprint = Sprint::find($sprintId);
            if (!$sprint) {
                return $this->notFoundResponse('Sprint no encontrado');
            }

            $validator = Validator::make($request->all(), [
                'categoria' => 'required|in:accion,logro,impedimento,comentario,otro',
                'descripcion' => 'required|string|max:500',
                'cumplida' => 'sometimes|boolean',
                'fecha_revision' => 'nullable|date|date_format:Y-m-d|after_or_equal:today'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'errors' => $validator->errors(),
                    'message' => 'Error de validación'
                ], 422);
            }

            $itemData = $validator->validated();
            $itemData['sprint_id'] = $sprintId;
            
            $item = RetroItem::create($itemData);
            
            return response()->json([
                'success' => true,
                'data' => $item,
                'message' => 'Item de retrospectiva creado exitosamente'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Error al crear item: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Actualizar estado de una acción (mejorado)
     */
    public function updateItem(Request $request, string $itemId)
    {
        try {
            $item = RetroItem::find($itemId);
            
            if (!$item) {
                return $this->notFoundResponse('Item no encontrado');
            }

            // Solo se actualiza si es una acción
            if ($item->categoria === 'accion') {
                $validator = Validator::make($request->all(), [
                    'cumplida' => 'required|boolean'
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'success' => false,
                        'errors' => $validator->errors(),
                        'message' => 'Error de validación'
                    ], 422);
                }

                $item->update($validator->validated());
            }
            
            return response()->json([
                'success' => true,
                'data' => $item,
                'message' => 'Item actualizado exitosamente'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error al actualizar item: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Eliminar un item (mejorado)
     */
    public function destroyItem(string $itemId)
    {
        try {
            $item = RetroItem::find($itemId);
            
            if (!$item) {
                return $this->notFoundResponse('Item no encontrado');
            }

            $item->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Item eliminado exitosamente'
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error al eliminar item: ' . $e->getMessage());
            return $this->serverErrorResponse();
        }
    }

    /**
     * Respuestas predefinidas para errores
     */
    private function notFoundResponse($message = 'Recurso no encontrado')
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], 404);
    }

    private function serverErrorResponse($message = 'Error interno del servidor')
    {
        return response()->json([
            'success' => false,
            'message' => $message
        ], 500);
    }
}