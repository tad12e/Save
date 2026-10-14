from unittest.mock import patch

from django.test import SimpleTestCase, TestCase
from django.test.utils import override_settings

from apps.users.models import CustomUser
from apps.users.serializers import GoogleAuthSerializer
from apps.users.services.otp import send_otp_email
from config.settings import _default_email_backend



class EmailBackendSettingsTests(SimpleTestCase):
	def test_defaults_to_smtp_when_smtp_settings_exist(self):
		with patch.dict(
			'os.environ',
			{
				'EMAIL_HOST': 'smtp.example.com',
				'EMAIL_PORT': '587',
			},
			clear=False,
		):
			self.assertEqual(_default_email_backend(), 'django.core.mail.backends.smtp.EmailBackend')

	def test_defaults_to_console_when_no_mail_settings_exist(self):
		with patch.dict(
			'os.environ',
			{
				'EMAIL_HOST': '',
				'EMAIL_HOST_USER': '',
				'EMAIL_HOST_PASSWORD': '',
				'EMAIL_PORT': '',
				'EMAIL_BACKEND': '',
			},
			clear=False,
		):
			self.assertEqual(_default_email_backend(), 'django.core.mail.backends.console.EmailBackend')


class OTPEmailDeliveryTests(SimpleTestCase):
	@patch('apps.users.services.otp.send_mail')
	@override_settings(BREVO_API_KEY='')
	def test_send_otp_email_uses_django_mail_backend_when_brevo_is_disabled(self, send_mail_mock):
		user = CustomUser(email='test@example.com', name='Test User')

		send_otp_email(user, '123456')

		send_mail_mock.assert_called_once()

	@patch('apps.users.tasks.send_otp_email_task.delay')
	@patch('apps.users.services.otp.assign_otp')
	@patch('apps.users.services.otp.check_otp_rate_limit')
	def test_issue_and_send_otp_dispatches_celery_task(self, rate_mock, assign_mock, delay_mock):
		from apps.users.services.otp import issue_and_send_otp
		user = CustomUser(id='00000000-0000-0000-0000-000000000001', email='test@example.com', name='Test User')
		assign_mock.return_value = '987654'

		issue_and_send_otp(user)

		delay_mock.assert_called_once_with('00000000-0000-0000-0000-000000000001', '987654')


class GoogleAuthSerializerTests(TestCase):
	@patch('apps.users.serializers.verify_google_access_token')
	def test_google_auth_can_sign_into_existing_email_account(self, verify_mock):
		verify_mock.return_value = {
			'email': 'existing@example.com',
			'google_id': 'google-123',
			'name': 'Google User',
			'picture': 'https://example.com/avatar.png',
		}
		user = CustomUser.objects.create_user(
			email='existing@example.com',
			password='password123',
			name='OTP User',
			auth_provider=CustomUser.AUTH_PROVIDER_EMAIL,
			is_email_verified=True,
		)

		serializer = GoogleAuthSerializer(data={'google_access_token': 'token'})

		self.assertTrue(serializer.is_valid(), serializer.errors)
		result = serializer.save()

		user.refresh_from_db()
		self.assertEqual(result.id, user.id)
		self.assertEqual(user.google_id, 'google-123')
		self.assertEqual(user.name, 'Google User')
		self.assertEqual(user.avatar_url, 'https://example.com/avatar.png')
		self.assertTrue(user.is_email_verified)
