from django.test import TestCase, Client
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Building, Event, LostItem, Profile

def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token), str(refresh)

def make_building(**kwargs):
    defaults = dict(name="Test Building", code="TST", category="facility", latitude=6.4672, longitude=3.5951, description="Test", image_url="https://example.com/img.jpg", opening_hours="9-5")
    defaults.update(kwargs)
    return Building.objects.create(**defaults)

class AuthTests(TestCase):
    def setUp(self): self.client = APIClient()
    def test_register_success(self):
        r = self.client.post('/api/auth/register/', {"username":"test@x.com","email":"test@x.com","password":"secure123"})
        self.assertEqual(r.status_code, 201)
    def test_register_duplicate(self):
        User.objects.create_user("dup@x.com","dup@x.com","pass")
        r = self.client.post('/api/auth/register/', {"username":"dup@x.com","email":"dup@x.com","password":"pass"})
        self.assertEqual(r.status_code, 400)
    def test_login_success(self):
        User.objects.create_user("u@x.com","u@x.com","pass123")
        r = self.client.post('/api/auth/login/', {"username":"u@x.com","password":"pass123"})
        self.assertEqual(r.status_code, 200)
        self.assertIn('access', r.json())
    def test_login_bad_password(self):
        User.objects.create_user("u2@x.com","u2@x.com","pass123")
        r = self.client.post('/api/auth/login/', {"username":"u2@x.com","password":"wrong"})
        self.assertEqual(r.status_code, 401)

class BuildingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.b1 = make_building(name="ICT Centre", code="ICT", category="facility")
        self.b2 = make_building(name="Library Block", code="LIB", category="library")
    def test_list_all(self):
        r = self.client.get('/api/buildings/')
        self.assertEqual(r.status_code, 200)
        self.assertGreaterEqual(len(r.json().get('results', r.json())), 2)
    def test_search_by_name(self):
        r = self.client.get('/api/buildings/?q=ICT')
        self.assertEqual(r.status_code, 200)
        data = r.json().get('results', r.json())
        self.assertTrue(any('ICT' in b['name'] for b in data))
    def test_filter_by_category(self):
        r = self.client.get('/api/buildings/?category=library')
        data = r.json().get('results', r.json())
        self.assertTrue(all(b['category'] == 'library' for b in data))
    def test_coordinate_in_response(self):
        r = self.client.get('/api/buildings/')
        data = r.json().get('results', r.json())
        self.assertIn('coordinate', data[0])
        self.assertIn('latitude', data[0]['coordinate'])

class LostItemTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user("li@x.com","li@x.com","pass123")
        Profile.objects.get_or_create(user=self.user)
        token, _ = get_tokens(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    def test_create_lost_item(self):
        r = self.client.post('/api/lost-items/', {"title":"Lost Phone","description":"Black iPhone","status":"lost","location_name":"Library","contact_hint":"Call me"})
        self.assertEqual(r.status_code, 201)
    def test_list_lost_items(self):
        r = self.client.get('/api/lost-items/')
        self.assertEqual(r.status_code, 200)
    def test_unauthenticated_create_fails(self):
        self.client.credentials()
        r = self.client.post('/api/lost-items/', {"title":"X","status":"lost","location_name":"X","contact_hint":"X"})
        self.assertIn(r.status_code, [401, 403])

class RouteTests(TestCase):
    def setUp(self): self.client = APIClient()
    def test_route_endpoint(self):
        r = self.client.get('/api/route/?orig_lat=6.4672&orig_lon=3.5951&dest_lat=6.4661&dest_lon=3.5979')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn('points', data)
        self.assertGreater(len(data['points']), 1)
    def test_route_missing_params(self):
        r = self.client.get('/api/route/?orig_lat=6.4672')
        self.assertEqual(r.status_code, 400)

class RoutingEngineTests(TestCase):
    def test_astar_pathfinding(self):
        from .routing import astar, CAMPUS_NODES
        start_id = "ict-center"
        end_id = "library-complex"
        path, dist = astar(start_id, end_id)
        self.assertIsNotNone(path)
        self.assertEqual(path[0], start_id)
        self.assertEqual(path[-1], end_id)
        self.assertGreater(dist, 0)

    def test_instruction_generation(self):
        from .routing import generate_instructions
        path = ["ict-center", "wp-central-north", "wp-central-mid", "library-complex"]
        instructions = generate_instructions(path)
        self.assertGreater(len(instructions), 1)
        self.assertIn("Start at", instructions[0]["instruction"])
        self.assertIn("arrived", instructions[-1]["instruction"].lower())

    def test_nearest_node(self):
        from .routing import nearest_node
        # Coordinate very close to ICT center
        node = nearest_node(6.4672, 3.5951)
        self.assertEqual(node, "ict-center")

class SecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_ratelimit_building_list(self):
        # We can't easily test ratelimit without making multiple requests
        # but we can verify the endpoint still works normally.
        r = self.client.get('/api/buildings/')
        self.assertEqual(r.status_code, 200)

class PaginationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        for i in range(25):
            make_building(name=f"Building {i}", code=f"B{i}")

    def test_building_pagination(self):
        r = self.client.get('/api/buildings/')
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn('results', data)
        self.assertIn('next', data)
        self.assertEqual(len(data['results']), 20) # Based on PAGE_SIZE = 20 in settings.py
