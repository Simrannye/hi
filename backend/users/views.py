from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import User

@csrf_exempt  # Disable CSRF (only for testing, secure this in production)
def signup(request):
    if request.method == "POST":
        data = json.loads(request.body)
        full_name = data.get("full_name")
        email = data.get("email")
        password = data.get("password")  # Hashing should be added for security

        if User.objects.filter(email=email).exists():
            return JsonResponse({"message": "Email already exists"}, status=400)

        user = User.objects.create(full_name=full_name, email=email, password=password)
        return JsonResponse({"message": "User registered successfully!"}, status=201)
