# api/serializers.py  (UPDATED — Angular-compatible flat fields)
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Category, TargetGroup, Location, Review, Favorite


# ============================================================================
# USER SERIALIZERS
# ============================================================================

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']


# ============================================================================
# PLAIN SERIALIZERS (from serializers.Serializer — rubric requirement)
# ============================================================================

class LoginSerializer(serializers.Serializer):
    """Validates login payload."""
    username = serializers.CharField(max_length=100)
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})


class RegisterSerializer(serializers.Serializer):
    """Validates registration payload."""
    username = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Passwords don't match."})
        if User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({"username": "Username already taken."})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email already registered."})
        return data


# ============================================================================
# MODEL SERIALIZERS (from serializers.ModelSerializer — rubric requirement)
# ============================================================================

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']


class TargetGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = TargetGroup
        fields = ['id', 'name']


class ReviewSerializer(serializers.ModelSerializer):
    """
    Returns flat fields for Angular.
    - `user` is an integer ID
    - `username` is a read-only display name
    - `location_name` is a read-only display name
    """
    username = serializers.SerializerMethodField(read_only=True)
    location_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'text', 'rating', 'user', 'username', 'location', 'location_name', 'created_at']
        read_only_fields = ['id', 'user', 'username', 'location_name', 'created_at']

    def get_username(self, obj):
        return obj.user.username if obj.user else None

    def get_location_name(self, obj):
        return obj.location.name if obj.location else None


class LocationSerializer(serializers.ModelSerializer):
    """
    Flat serializer for Angular compatibility.
    - On READ:  `category` is int ID, `category_name` is display string
    - On WRITE: accepts `category` (int) and `target_group` (int | null)
    """
    # Read-only display fields
    category_name = serializers.SerializerMethodField(read_only=True)
    target_group_name = serializers.SerializerMethodField(read_only=True)
    created_by_username = serializers.SerializerMethodField(read_only=True)
    average_rating = serializers.SerializerMethodField(read_only=True)
    reviews_count = serializers.SerializerMethodField(read_only=True)

    # Writable FK fields — sent as integer IDs from Angular form
    category = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all())
    target_group = serializers.PrimaryKeyRelatedField(
        queryset=TargetGroup.objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Location
        fields = [
            'id', 'name', 'description', 'city', 'image',
            'category', 'category_name',
            'target_group', 'target_group_name',
            'created_by', 'created_by_username',
            'created_at',
            'average_rating', 'reviews_count',
        ]
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_target_group_name(self, obj):
        return obj.target_group.name if obj.target_group else None

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None

    def get_average_rating(self, obj):
        reviews = obj.reviews.all()
        if not reviews.exists():
            return None
        return round(sum(r.rating for r in reviews) / reviews.count(), 1)

    def get_reviews_count(self, obj):
        return obj.reviews.count()

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user if request else None
        return super().create(validated_data)


class FavoriteSerializer(serializers.ModelSerializer):
    """Flat favorites: returns location ID plus display fields."""
    location_name = serializers.SerializerMethodField(read_only=True)
    location_city = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Favorite
        fields = ['id', 'user', 'location', 'location_name', 'location_city']
        read_only_fields = ['id', 'user', 'location_name', 'location_city']

    def get_location_name(self, obj):
        return obj.location.name if obj.location else None

    def get_location_city(self, obj):
        return obj.location.city if obj.location else None
