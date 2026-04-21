# api/views.py  (COMPLETE UPDATED VERSION — drop-in replacement)
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404

from .models import Category, TargetGroup, Location, Review, Favorite
from .serializers import (
    LoginSerializer, RegisterSerializer, UserSerializer,
    CategorySerializer, TargetGroupSerializer,
    LocationSerializer, ReviewSerializer, FavoriteSerializer
)


# ============================================================================
# FUNCTION-BASED VIEWS (FBVs) — Authentication
# ============================================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """Register a new user. Returns token + user data."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            email=serializer.validated_data['email'],
            password=serializer.validated_data['password']
        )
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Authenticate user and return token."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if user is not None:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data,
                'message': 'Logged in successfully'
            }, status=status.HTTP_200_OK)
        return Response(
            {'error': 'Invalid username or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Invalidate the user's auth token."""
    request.user.auth_token.delete()
    return Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)


# ============================================================================
# CLASS-BASED VIEWS (CBVs)
# ============================================================================

class LocationListCreateView(APIView):
    """
    GET  /api/locations/  — list all (filterable by ?city= and ?target_group=)
    POST /api/locations/  — create (auth required)
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        locations = Location.objects.all()

        city = request.query_params.get('city')
        if city:
            locations = locations.by_city(city)

        target_group = request.query_params.get('target_group')
        if target_group:
            locations = locations.by_target_group(target_group)

        serializer = LocationSerializer(locations, many=True, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        serializer = LocationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LocationDetailView(APIView):
    """
    GET    /api/locations/<pk>/  — retrieve
    PUT    /api/locations/<pk>/  — update (owner or staff)
    DELETE /api/locations/<pk>/  — delete (owner or staff)
    """

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_object(self, pk):
        return get_object_or_404(Location, pk=pk)

    def get(self, request, pk):
        location = self.get_object(pk)
        serializer = LocationSerializer(location, context={'request': request})
        return Response(serializer.data)

    def put(self, request, pk):
        location = self.get_object(pk)
        if location.created_by != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to edit this location'},
                status=status.HTTP_403_FORBIDDEN
            )
        serializer = LocationSerializer(
            location, data=request.data, partial=True, context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        location = self.get_object(pk)
        if location.created_by != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to delete this location'},
                status=status.HTTP_403_FORBIDDEN
            )
        location.delete()
        return Response({'message': 'Location deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


class ReviewListCreateView(APIView):
    """
    GET  /api/reviews/?location_id=<id>  — list reviews for a location
    POST /api/reviews/                    — create review (auth required)
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, request):
        reviews = Review.objects.all()
        location_id = request.query_params.get('location_id')
        if location_id:
            reviews = reviews.filter(location_id=location_id)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReviewDetailView(APIView):
    """DELETE /api/reviews/<pk>/  — delete own review"""
    permission_classes = [IsAuthenticated]

    def get_object(self, pk):
        return get_object_or_404(Review, pk=pk)

    def delete(self, request, pk):
        review = self.get_object(pk)
        if review.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'You do not have permission to delete this review'},
                status=status.HTTP_403_FORBIDDEN
            )
        review.delete()
        return Response({'message': 'Review deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


class FavoriteView(APIView):
    """
    GET    /api/favorites/  — list current user's favorites
    POST   /api/favorites/  — add to favorites  { location_id: <int> }
    DELETE /api/favorites/  — remove from favorites  { location_id: <int> }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user)
        serializer = FavoriteSerializer(favorites, many=True)
        return Response(serializer.data)

    def post(self, request):
        location_id = request.data.get('location_id')
        if not location_id:
            return Response({'error': 'location_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            location = Location.objects.get(id=location_id)
        except Location.DoesNotExist:
            return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)
        if Favorite.objects.filter(user=request.user, location=location).exists():
            return Response({'error': 'Location already in favorites'}, status=status.HTTP_400_BAD_REQUEST)
        favorite = Favorite.objects.create(user=request.user, location=location)
        serializer = FavoriteSerializer(favorite)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        # Angular sends body as JSON with Content-Type: application/json
        location_id = request.data.get('location_id') or request.query_params.get('location_id')
        if not location_id:
            return Response({'error': 'location_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            favorite = Favorite.objects.get(user=request.user, location_id=location_id)
            favorite.delete()
            return Response({'message': 'Removed from favorites'}, status=status.HTTP_204_NO_CONTENT)
        except Favorite.DoesNotExist:
            return Response({'error': 'Favorite not found'}, status=status.HTTP_404_NOT_FOUND)


class CategoryListView(APIView):
    """GET /api/categories/"""
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class TargetGroupListView(APIView):
    """GET /api/target-groups/"""
    permission_classes = [AllowAny]

    def get(self, request):
        target_groups = TargetGroup.objects.all()
        serializer = TargetGroupSerializer(target_groups, many=True)
        return Response(serializer.data)
