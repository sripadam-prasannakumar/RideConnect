
with open(r'c:\Users\Lenovo\Desktop\Ride Connect\backend_project\rideconnect_backend\ride\views.py', 'a') as f:
    f.write('''

class CarBrandListView(APIView):
    """Returns all available car brands"""
    def get(self, request):
        brands = CarBrand.objects.all().order_by('brand_name')
        serializer = CarBrandSerializer(brands, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class CarModelListView(APIView):
    """Returns all models for a specific brand ID"""
    def get(self, request):
        brand_id = request.query_params.get('brand_id')
        if not brand_id:
            return Response({'error': 'brand_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            models = CarModel.objects.filter(brand_id=brand_id).order_by('model_name')
            serializer = CarModelSerializer(models, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
''')
