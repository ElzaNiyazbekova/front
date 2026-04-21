# api/views.py  (UPDATED — patch for FavoriteView DELETE with request body)
# Only the FavoriteView.delete() method needs updating since DRF's DELETE
# doesn't parse the body by default. Add this import and override:

# In your existing views.py, replace the FavoriteView.delete() method with:

    def delete(self, request):
        """Remove location from favorites — reads location_id from request body or query params."""
        # DRF parses JSON body for DELETE when Content-Type: application/json is set
        location_id = request.data.get('location_id') or request.query_params.get('location_id')

        if not location_id:
            return Response(
                {'error': 'location_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            favorite = Favorite.objects.get(
                user=request.user,
                location_id=location_id
            )
            favorite.delete()
            return Response(
                {'message': 'Removed from favorites'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Favorite.DoesNotExist:
            return Response(
                {'error': 'Favorite not found'},
                status=status.HTTP_404_NOT_FOUND
            )

# ---- COMPLETE UPDATED views.py BELOW ----
