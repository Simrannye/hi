from django.db import models

class User(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # Store hashed passwords later

    def __str__(self):
        return self.full_name