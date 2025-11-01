<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Blog extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'author_id',
        'title',
        'slug',
        'content',
        'excerpt',
        'featured_image',
        'category',
        'tags',
        'status',
        'published_at',
        'views_count',
    ];

    protected function casts(): array
    {
        return [
            'published_at' => 'datetime',
            'views_count' => 'integer',
            'tags' => 'array',
        ];
    }

    /**
     * Relationships
     */

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    /**
     * Scopes
     */

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
                     ->whereNotNull('published_at')
                     ->where('published_at', '<=', now());
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    public function scopePopular($query, $limit = 10)
    {
        return $query->orderBy('views_count', 'desc')->limit($limit);
    }

    /**
     * Check if blog is published
     */
    public function isPublished()
    {
        return $this->status === 'published' && 
               $this->published_at !== null && 
               $this->published_at <= now();
    }

    /**
     * Publish blog
     */
    public function publish()
    {
        $this->status = 'published';
        $this->published_at = now();
        $this->save();
    }

    /**
     * Increment views count
     */
    public function incrementViews()
    {
        $this->increment('views_count');
    }

    /**
     * Generate URL-friendly slug from title
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($blog) {
            if (empty($blog->slug)) {
                $blog->slug = static::generateUniqueSlug($blog->title);
            }
        });
    }

    /**
     * Generate unique slug
     */
    protected static function generateUniqueSlug($title)
    {
        $slug = str($title)->slug();
        $count = static::where('slug', 'like', $slug . '%')->count();

        if ($count > 0) {
            return $slug . '-' . ($count + 1);
        }

        return $slug;
    }
}
