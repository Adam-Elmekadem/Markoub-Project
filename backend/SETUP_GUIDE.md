# MARKOUB Backend Setup Guide

## ✅ Completed Steps

1. **Laravel Project Structure Created**
   - ✅ All directories created (app, config, database, routes, etc.)
   - ✅ Composer dependencies installed (Laravel 11, JWT Auth, etc.)
   - ✅ Application key generated
   - ✅ JWT secret key generated

2. **Models Created**
   - ✅ User (with JWT authentication)
   - ✅ Profile
   - ✅ Ride
   - ✅ Booking
   - ✅ Comment
   - ✅ Blog

3. **Database Migrations Created**
   - ✅ users table
   - ✅ profiles table
   - ✅ rides table
   - ✅ bookings table
   - ✅ comments table
   - ✅ blogs table

4. **API Structure**
   - ✅ AuthController (register, login, logout, refresh, me)
   - ✅ API routes configured (v1 versioning)
   - ✅ Request validation classes (LoginRequest, RegisterRequest)
   - ✅ API Resources (UserResource, ProfileResource, RideResource, etc.)
   - ✅ Role middleware for authorization

5. **Configuration**
   - ✅ JWT authentication configured
   - ✅ CORS enabled for React frontend
   - ✅ Database configuration set
   - ✅ Auth guards configured (web, api)

## 📋 Next Steps

### 1. Create MySQL Database

Open MySQL command line or phpMyAdmin and run:

```sql
CREATE DATABASE markoub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Database Connection

The `.env` file is already created. Update these values if needed:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=markoub_db
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
```

### 3. Run Migrations

```powershell
cd "c:\Users\DELL\Downloads\MARKOUB PROJECT\MARKOUB\backend"
php artisan migrate
```

This will create all the database tables.

### 4. Seed Test Data (Optional)

```powershell
php artisan db:seed
```

This creates test users:
- **Admin**: admin@markoub.com / admin123
- **Driver**: driver@markoub.com / driver123
- **Passenger**: passenger@markoub.com / passenger123

### 5. Start the Development Server

```powershell
php artisan serve
```

The API will be available at: `http://localhost:8000`

### 6. Test the API

#### Test Registration:
```powershell
curl -X POST http://localhost:8000/api/v1/register `
  -H "Content-Type: application/json" `
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "password": "password123",
    "password_confirmation": "password123",
    "phone": "+1234567890",
    "role": "passenger"
  }'
```

#### Test Login:
```powershell
curl -X POST http://localhost:8000/api/v1/login `
  -H "Content-Type: application/json" `
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

Save the `token` from the response for authenticated requests.

#### Test Protected Endpoint:
```powershell
curl -X GET http://localhost:8000/api/v1/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🔧 Additional Controllers Needed

You still need to create these controllers for full CRUD operations:

1. **RideController** - Manage rides (create, list, update, delete)
2. **BookingController** - Manage bookings
3. **ProfileController** - Manage user profiles
4. **CommentController** - Manage comments/reviews
5. **BlogController** - Manage blog posts

### Quick Controller Creation

```powershell
php artisan make:controller Api/V1/RideController --api
php artisan make:controller Api/V1/BookingController --api
php artisan make:controller Api/V1/ProfileController --api
php artisan make:controller Api/V1/CommentController --api
php artisan make:controller Api/V1/BlogController --api
```

## 📁 Project Structure

```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/V1/
│   │   │       └── AuthController.php ✅
│   │   ├── Middleware/
│   │   │   └── RoleMiddleware.php ✅
│   │   ├── Requests/
│   │   │   ├── LoginRequest.php ✅
│   │   │   └── RegisterRequest.php ✅
│   │   └── Resources/
│   │       ├── UserResource.php ✅
│   │       ├── ProfileResource.php ✅
│   │       ├── RideResource.php ✅
│   │       ├── BookingResource.php ✅
│   │       ├── CommentResource.php ✅
│   │       └── BlogResource.php ✅
│   └── Models/
│       ├── User.php ✅
│       ├── Profile.php ✅
│       ├── Ride.php ✅
│       ├── Booking.php ✅
│       ├── Comment.php ✅
│       └── Blog.php ✅
├── config/
│   ├── auth.php ✅
│   ├── cors.php ✅
│   ├── database.php ✅
│   └── jwt.php ✅
├── database/
│   ├── migrations/ ✅ (6 migration files)
│   ├── seeders/
│   │   └── DatabaseSeeder.php ✅
│   └── factories/
│       └── UserFactory.php ✅
├── routes/
│   ├── api.php ✅
│   └── web.php ✅
├── .env ✅
├── composer.json ✅
└── README.md ✅
```

## 🌐 API Endpoints

### Public Endpoints (No Auth Required)

- `POST /api/v1/register` - Register new user
- `POST /api/v1/login` - User login
- `GET /api/v1/rides` - List available rides
- `GET /api/v1/rides/{id}` - Get ride details
- `GET /api/v1/blogs` - List blogs
- `GET /api/v1/blogs/{slug}` - Get blog by slug

### Protected Endpoints (JWT Required)

- `POST /api/v1/logout` - Logout
- `POST /api/v1/refresh` - Refresh token
- `GET /api/v1/me` - Get current user
- `GET /api/v1/profile` - Get user profile
- `PUT /api/v1/profile` - Update profile
- `POST /api/v1/rides` - Create ride (driver)
- `PUT /api/v1/rides/{id}` - Update ride
- `DELETE /api/v1/rides/{id}` - Delete ride
- `POST /api/v1/bookings` - Create booking
- `GET /api/v1/bookings` - List user bookings
- `POST /api/v1/comments` - Add comment/review

### Admin Only Endpoints

- `POST /api/v1/blogs` - Create blog
- `PUT /api/v1/blogs/{id}` - Update blog
- `DELETE /api/v1/blogs/{id}` - Delete blog

## 🔐 JWT Authentication Flow

1. **Register/Login** → Get JWT token
2. **Store token** in frontend (localStorage, etc.)
3. **Include token** in all protected requests:
   ```
   Authorization: Bearer {token}
   ```
4. **Token expires** after 60 minutes
5. **Refresh token** using `/api/v1/refresh` endpoint

## 🔄 Connecting to React Frontend

Update your React `.env` file:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Example React API call:

```javascript
const response = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'john@example.com',
    password: 'password123'
  })
});

const data = await response.json();
const token = data.data.token;

// Store token
localStorage.setItem('token', token);

// Use token in subsequent requests
const protectedResponse = await fetch(`${import.meta.env.VITE_API_URL}/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🐛 Troubleshooting

### Migration Errors

If you get migration errors:

```powershell
php artisan migrate:fresh
```

This drops all tables and re-runs migrations.

### JWT Token Issues

If JWT tokens aren't working:

```powershell
php artisan config:clear
php artisan cache:clear
```

### CORS Issues

If React frontend can't connect:

1. Check `.env` has correct `FRONTEND_URL`
2. Check `config/cors.php` includes your frontend URL
3. Restart Laravel server after changes

## 📚 Resources

- **Laravel Docs**: https://laravel.com/docs/11.x
- **JWT Auth**: https://jwt-auth.readthedocs.io/
- **API Testing**: Use Postman or Insomnia for testing

## 🎯 Summary

Your Laravel backend is now set up with:

✅ JWT authentication
✅ Complete database schema
✅ API versioning (v1)
✅ Role-based access control
✅ CORS configuration for React
✅ Request validation
✅ API resources for JSON responses

**Next immediate step**: Run `php artisan migrate` after creating the MySQL database!
