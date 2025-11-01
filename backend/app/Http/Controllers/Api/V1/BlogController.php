<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\BlogResource;
use App\Models\Blog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class BlogController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Blog::with('author')
            ->published()
            ->latest('published_at');

        if ($search = $request->query('q')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%$search%")
                  ->orWhere('excerpt', 'like', "%$search%")
                  ->orWhere('content', 'like', "%$search%");
            });
        }

        if ($category = $request->query('category')) {
            $query->byCategory($category);
        }

        $blogs = $query->paginate(10);

        return response()->json([
            'success' => true,
            'data' => BlogResource::collection($blogs),
            'meta' => [
                'total' => $blogs->total(),
                'per_page' => $blogs->perPage(),
                'current_page' => $blogs->currentPage(),
                'last_page' => $blogs->lastPage(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|url',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'status' => 'nullable|in:draft,published,archived',
        ]);

        $validated['author_id'] = auth('api')->id();
        $blog = Blog::create($validated);

        if (($validated['status'] ?? 'draft') === 'published') {
            $blog->publish();
        }

        return response()->json([
            'success' => true,
            'message' => 'Blog created successfully',
            'data' => new BlogResource($blog->load('author')),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $slugOrId): JsonResponse
    {
        $blog = Blog::with('author')
            ->when(is_numeric($slugOrId), fn($q) => $q->where('id', $slugOrId))
            ->when(!is_numeric($slugOrId), fn($q) => $q->where('slug', $slugOrId))
            ->firstOrFail();

        // Increment views
        $blog->incrementViews();

        return response()->json([
            'success' => true,
            'data' => new BlogResource($blog),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $blog = Blog::findOrFail($id);

        // Only author or admin can update
        $user = auth('api')->user();
        if ($user->id !== $blog->author_id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'content' => 'sometimes|string',
            'excerpt' => 'nullable|string',
            'featured_image' => 'nullable|url',
            'category' => 'nullable|string|max:100',
            'tags' => 'nullable|array',
            'status' => 'nullable|in:draft,published,archived',
        ]);

        $blog->update($validated);

        if (($validated['status'] ?? null) === 'published' && !$blog->isPublished()) {
            $blog->publish();
        }

        return response()->json([
            'success' => true,
            'message' => 'Blog updated successfully',
            'data' => new BlogResource($blog->load('author')),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $blog = Blog::findOrFail($id);

        // Only author or admin can delete
        $user = auth('api')->user();
        if ($user->id !== $blog->author_id && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized',
            ], 403);
        }

        $blog->delete();

        return response()->json([
            'success' => true,
            'message' => 'Blog deleted successfully',
        ]);
    }
}
