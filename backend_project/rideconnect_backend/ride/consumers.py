import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

@database_sync_to_async
def set_user_online_status(user_id, is_online):
    from django.contrib.auth.models import User
    try:
        # Ensure user_id is integer-like
        if not str(user_id).isdigit():
            return
        user = User.objects.get(id=user_id)
        if hasattr(user, 'customer'):
            user.customer.is_online = is_online
            user.customer.save(update_fields=['is_online'])
        if hasattr(user, 'driver'):
            user.driver.is_online = is_online
            user.driver.save(update_fields=['is_online'])
    except (User.DoesNotExist, ValueError):
        pass

class RideConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user_id = self.scope['url_route']['kwargs']['user_id']
        self.user_group_name = f'user_{self.user_id}'
        self.drivers_group_name = 'drivers'

        # Join personal user group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )

        # Drivers also join the 'drivers' group to receive general ride requests
        await self.channel_layer.group_add(
            self.drivers_group_name,
            self.channel_name
        )
        
        # Drivers also join vehicle-specific groups if they specify it in query params
        # For now, let's allow joining based on a 'vehicle_type' query param if provided
        query_string = self.scope.get('query_string', b'').decode()
        from urllib.parse import parse_qs
        params = parse_qs(query_string)
        v_type = params.get('vehicle_type', [None])[0]
        
        if v_type:
            self.vehicle_group_name = f'drivers_{v_type}'
            await self.channel_layer.group_add(
                self.vehicle_group_name,
                self.channel_name
            )
        else:
            self.vehicle_group_name = None

        await self.accept()
        await set_user_online_status(self.user_id, True)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.user_group_name,
            self.channel_name
        )
        await self.channel_layer.group_discard(
            self.drivers_group_name,
            self.channel_name
        )
        if hasattr(self, 'vehicle_group_name') and self.vehicle_group_name:
            await self.channel_layer.group_discard(
                self.vehicle_group_name,
                self.channel_name
            )
        await set_user_online_status(self.user_id, False)

    # Receive message from WebSocket
    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ride_request':
            ride_data = data.get('ride_data', {})
            v_type = ride_data.get('selected_vehicle_type', 'car')
            target_group = f'drivers_{v_type}'
            
            # Broadcast only to drivers of that vehicle type
            await self.channel_layer.group_send(
                target_group,
                {
                    'type': 'new_ride_notification',
                    'ride_data': ride_data
                }
            )
        
        elif message_type == 'ride_accepted':
            # Notify the customer and other drivers
            ride_id = data.get('ride_id')
            driver_data = data.get('driver_data')
            customer_id = data.get('customer_id')
            
            # Notify customer
            await self.channel_layer.group_send(
                f'user_{customer_id}',
                {
                    'type': 'ride_update',
                    'ride_status': 'accepted',
                    'driver_data': driver_data
                }
            )

    # Handler for 'new_ride_notification'
    async def new_ride_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'new_ride_request',
            'ride_data': event['ride_data']
        }))

    # Handler for 'ride_update'
    async def ride_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_update',
            'status': event['ride_status'],
            'status_details': event.get('driver_data')
        }))


class DriverConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.driver_id = self.scope['url_route']['kwargs']['driver_id']
        self.group_name = f"driver_{self.driver_id}"

        # Join personal group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )

        # Also join vehicle-specific group to receive 'ride_taken' updates
        # We'll try to get vehicle_type from query params or database if needed
        # For Rapido-like flow, let's allow query param for simplicity first
        from urllib.parse import parse_qs
        query_params = parse_qs(self.scope['query_string'].decode())
        v_type = query_params.get('vehicle_type', [None])[0]
        
        if v_type:
            self.vehicle_group_name = f"drivers_{v_type}"
            await self.channel_layer.group_add(
                self.vehicle_group_name,
                self.channel_name
            )

        await self.accept()
        await set_user_online_status(self.driver_id, True)

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        if hasattr(self, 'vehicle_group_name'):
            await self.channel_layer.group_discard(
                self.vehicle_group_name,
                self.channel_name
            )
        await set_user_online_status(self.driver_id, False)

    async def send_ride_request(self, event):
        # Forward to WebSocket
        await self.send(text_data=json.dumps({
            "type": "new_ride_request",
            "ride_data": event["data"]
        }))

    async def ride_taken(self, event):
        # Forward to WebSocket so UI can hide the popup
        await self.send(text_data=json.dumps({
            "type": "ride_taken",
            "ride_id": event["ride_id"]
        }))

    async def ride_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'ride_update',
            'status': event['ride_status'],
            'ride_id': event.get('ride_id'),
            'driver_data': event.get('driver_data')
        }))
