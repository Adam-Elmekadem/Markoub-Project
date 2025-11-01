<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['required', 'string', 'max:20'],
            'city' => ['required', 'string', 'max:100'],
            'birthday' => ['required', 'date', 'before:today'],
            'address' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', 'in:male,female,other'],
            'role' => ['nullable', 'in:passenger,driver'],
            // Driver-specific fields (optional, required only if role=driver)
            'license_number' => ['required_if:role,driver', 'string', 'max:50'],
            'vehicle_model' => ['required_if:role,driver', 'string', 'max:100'],
            'vehicle_number' => ['required_if:role,driver', 'string', 'max:20'],
            'vehicle_color' => ['required_if:role,driver', 'string', 'max:50'],
            'vehicle_year' => ['required_if:role,driver', 'digits:4'],
        ];
    }

    /**
     * Custom messages
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'This email address is already registered.',
            'password.confirmed' => 'Password confirmation does not match.',
            'password.min' => 'Password must be at least 8 characters.',
            'birthday.required' => 'Birthday is required.',
            'birthday.before' => 'You must be at least 18 years old.',
            'city.required' => 'City is required.',
            'license_number.required_if' => 'Driving license number is required for drivers.',
            'vehicle_model.required_if' => 'Vehicle model is required for drivers.',
            'vehicle_number.required_if' => 'Vehicle number is required for drivers.',
        ];
    }
}
