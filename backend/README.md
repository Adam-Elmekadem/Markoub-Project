# MARKOUB Backend API

Laravel 11 RESTful API for the MARKOUB rideshare application with JWT authentication.

## Features

- **JWT Authentication** - Secure token-based authentication
- **Role-Based Access Control** - Admin, Driver, and Passenger roles
- **RESTful API Design** - Clean and consistent API endpoints
- **API Versioning** - v1 namespace for future compatibility
- **Database Relationships** - Eloquent ORM with proper relationships
- **Request Validation** - Form request validation for all inputs
- **API Resources** - Consistent JSON response formatting
- **CORS Support** - Configured for React frontend integration
- **Rate Limiting** - API rate limiting for security
- **Soft Deletes** - Data preservation for rides, bookings, and blogs

## Tech Stack

- **Laravel** 11.x
- **PHP** 8.2+
- **MySQL** 5.7+ / 8.0+
- **JWT Auth** (tymon/jwt-auth)
- **Composer** for dependency management

## Installation

### Prerequisites

- PHP 8.2 or higher
- Composer
- MySQL 5.7+ or 8.0+
- Git

### Setup Instructions

1. **Clone the repository** (if using Git)
   ```bash
   cd backend
   ```

2. **Install PHP dependencies**
   ```powershell
   composer install
   ```

3. **Create environment file**
   ```powershell
   cp .env.example .env
   ```

4. **Configure environment variables**
   
   Edit `.env` file and update these values:
   ```env
   APP_NAME="MARKOUB API"
   APP_URL=http://localhost:8000

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=markoub_db
   DB_USERNAME=root
   DB_PASSWORD=your_password

   FRONTEND_URL=http://localhost:5173
   ```

5. **Generate application key**
   ```powershell
   php artisan key:generate
   ```

6. **Generate JWT secret**
   ```powershell
   php artisan jwt:secret
   ```

7. **Create database**
   
   Create a MySQL database named `markoub_db`:
   ```sql
   CREATE DATABASE markoub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

8. **Run migrations**
   ```powershell
   php artisan migrate
   ```

9. **Seed database (optional)**
   ```powershell
   php artisan db:seed
   ```

10. **Start development server**
    ```powershell
    php artisan serve
    ```

The API will be available at: `http://localhost:8000/api/v1`

## API Documentation

### Base URL

```
http://localhost:8000/api/v1
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer {your-jwt-token}
```

### API Endpoints

#### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| POST | `/refresh` | Refresh JWT token | Yes |
| GET | `/me` | Get authenticated user | Yes |

#### Profile Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| POST | `/profile/upload-picture` | Upload profile picture | Yes |

#### Rides

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/rides` | List all available rides | No |
| GET | `/rides/{id}` | Get ride details | No |
| POST | `/rides` | Create new ride (driver) | Yes |
| PUT | `/rides/{id}` | Update ride | Yes |
| DELETE | `/rides/{id}` | Delete ride | Yes |
| GET | `/my-rides` | Get user's rides | Yes |

#### Bookings

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/bookings` | List user bookings | Yes |
| POST | `/bookings` | Create booking | Yes |
| GET | `/bookings/{id}` | Get booking details | Yes |
| PUT | `/bookings/{id}` | Update booking | Yes |
| DELETE | `/bookings/{id}` | Cancel booking | Yes |
| POST | `/bookings/{id}/confirm` | Confirm booking | Yes |
| POST | `/bookings/{id}/cancel` | Cancel booking | Yes |

#### Comments/Reviews

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/comments` | Add comment/review | Yes |
| PUT | `/comments/{id}` | Update comment | Yes |
| DELETE | `/comments/{id}` | Delete comment | Yes |

#### Blogs (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/blogs` | List all blogs | No |
| GET | `/blogs/{slug}` | Get blog by slug | No |
| POST | `/blogs` | Create blog (admin) | Yes (Admin) |
| PUT | `/blogs/{id}` | Update blog (admin) | Yes (Admin) |
| DELETE | `/blogs/{id}` | Delete blog (admin) | Yes (Admin) |

### Request/Response Examples

#### Register User

**Request:**
```json
POST /api/v1/register
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "phone": "+1234567890",
  "role": "passenger"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "role": "passenger",
      "is_verified": false,
      "created_at": "2024-01-01 10:00:00"
    },
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

#### Login

**Request:**
```json
POST /api/v1/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {...},
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "token_type": "bearer",
    "expires_in": 3600
  }
}
```

#### Create Ride (Driver)

**Request:**
```json
POST /api/v1/rides
Authorization: Bearer {token}
Content-Type: application/json

{
  "from_location": "New York, NY",
  "to_location": "Boston, MA",
  "from_latitude": 40.7128,
  "from_longitude": -74.0060,
  "to_latitude": 42.3601,
  "to_longitude": -71.0589,
  "ride_date": "2024-01-15",
  "ride_time": "09:00:00",
  "seats_available": 3,
  "price_per_seat": 25.00,
  "vehicle_model": "Toyota Camry",
  "vehicle_number": "ABC123",
  "allow_smoking": false,
  "allow_pets": true,
  "allow_music": true
}
```

#### Book a Ride (Passenger)

**Request:**
```json
POST /api/v1/bookings
Authorization: Bearer {token}
Content-Type: application/json

{
  "ride_id": 1,
  "seats_booked": 2,
  "pickup_location": "Times Square",
  "dropoff_location": "Downtown Boston",
  "payment_method": "card",
  "notes": "Please call when you arrive"
}
```

## Database Schema

### Users Table
- `id`, `first_name`, `last_name`, `email`, `password`
- `phone`, `role` (passenger/driver/admin)
- `is_verified`, `email_verified_at`

### Profiles Table
- `user_id` (FK), `phone`, `city`, `bio`
- `date_of_birth`, `gender`
- `driver_license_number`, `vehicle_model`, `vehicle_color`
- `is_driver_verified`, `profile_picture`

### Rides Table
- `driver_id` (FK), `from_location`, `to_location`
- `from_latitude`, `from_longitude`, `to_latitude`, `to_longitude`
- `ride_date`, `ride_time`, `ride_type`
- `seats_available`, `price_per_seat`
- `allow_smoking`, `allow_pets`, `allow_music`
- `status` (active/completed/cancelled)

### Bookings Table
- `ride_id` (FK), `user_id` (FK)
- `seats_booked`, `total_price`
- `payment_method`, `payment_status`
- `status` (pending/confirmed/cancelled/completed)
- `pickup_location`, `dropoff_location`, `notes`

### Comments Table
- `user_id` (FK), `ride_id` (FK)
- `rating`, `comment_text`, `is_approved`

### Blogs Table
- `author_id` (FK), `title`, `slug`, `content`
- `featured_image`, `category`, `tags`
- `status` (draft/published/archived)
- `published_at`, `views_count`

## Testing

Run tests with:
```powershell
php artisan test
```

## Security

- **JWT Authentication**: Stateless authentication using JSON Web Tokens
- **Password Hashing**: Bcrypt hashing for passwords
- **Rate Limiting**: 60 requests per minute per IP
- **CORS Protection**: Configured allowed origins
- **Input Validation**: Request validation on all endpoints
- **SQL Injection Protection**: Eloquent ORM parameterized queries
- **XSS Protection**: JSON responses automatically escaped

## License

MIT License

## Support

For support, email support@markoub.com or open an issue in the repository.

## Credits

Developed for the MARKOUB rideshare platform.
