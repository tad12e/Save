import logging
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ApiKey

logger = logging.getLogger(__name__)


class ApiKeyListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        keys = ApiKey.objects.filter(user=request.user)
        data = [
            {
                'id': str(k.id),
                'name': k.name,
                'prefix': k.prefix,
                'is_active': k.is_active,
                'last_used_at': k.last_used_at.isoformat() if k.last_used_at else None,
                'created_at': k.created_at.isoformat(),
            }
            for k in keys
        ]
        return Response(data, status=status.HTTP_200_OK)

    def post(self, request):
        name = request.data.get('name', '').strip() or 'Save MCP Key'
        api_key, raw_token = ApiKey.generate_key(user=request.user, name=name)

        api_url = request.build_absolute_uri('/api/v1')

        # Claude Desktop and Cursor configuration snippets
        claude_snippet = {
            "mcpServers": {
                "save": {
                    "command": "uvx",
                    "args": ["save-mcp"],
                    "env": {
                        "SAVE_API_KEY": raw_token,
                        "SAVE_API_URL": api_url,
                    },
                }
            }
        }

        return Response(
            {
                'id': str(api_key.id),
                'name': api_key.name,
                'prefix': api_key.prefix,
                'api_key': raw_token,  # Only shown once
                'created_at': api_key.created_at.isoformat(),
                'mcp_config': claude_snippet,
                'message': 'Copy your API key now. It will not be shown again.',
            },
            status=status.HTTP_201_CREATED,
        )


class ApiKeyDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, key_id):
        try:
            api_key = ApiKey.objects.get(id=key_id, user=request.user)
        except ApiKey.DoesNotExist:
            return Response({'error': 'API key not found.'}, status=status.HTTP_404_NOT_FOUND)

        api_key.delete()
        return Response({'message': 'API key revoked successfully.'}, status=status.HTTP_200_OK)
