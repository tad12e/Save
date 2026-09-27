import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';

enum AuthStatus {
  initial,
  authenticated,
  unauthenticated,
  pendingVerification,
}

class AuthProvider extends ChangeNotifier {
  AuthStatus _status = AuthStatus.initial;
  UserModel? _user;
  String? _pendingEmail;
  bool _isLoading = false;
  String? _errorMessage;

  AuthStatus get status => _status;
  UserModel? get user => _user;
  String? get pendingEmail => _pendingEmail;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _status == AuthStatus.authenticated;

  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await ApiService.getAccessToken();
      if (token != null && token.isNotEmpty) {
        // Load cached user first for instant UI response
        _user = await ApiService.getSavedUser();
        _status = AuthStatus.authenticated;
        notifyListeners();

        // Validate/refresh user profile from backend
        final currentUser = await ApiService.fetchCurrentUser();
        if (currentUser != null) {
          _user = currentUser;
        }
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      _status = AuthStatus.unauthenticated;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await ApiService.signIn(email: email, password: password);
    _isLoading = false;

    if (result['success'] == true) {
      _user = result['user'] as UserModel?;
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      if (result['isUnverified'] == true) {
        _pendingEmail = email.trim().toLowerCase();
        _status = AuthStatus.pendingVerification;
        _errorMessage = 'Please verify your email before continuing.';
        notifyListeners();
        return false;
      }
      _errorMessage = result['message']?.toString() ?? 'Sign in failed.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> signUp({
    required String name,
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await ApiService.signUp(
      name: name,
      email: email,
      password: password,
      confirmPassword: confirmPassword,
    );
    _isLoading = false;

    if (result['success'] == true) {
      _pendingEmail = email.trim().toLowerCase();
      _status = AuthStatus.pendingVerification;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message']?.toString() ?? 'Registration failed.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> verifyOtp(String otp, {String? email}) async {
    final targetEmail = email ?? _pendingEmail;
    if (targetEmail == null || targetEmail.isEmpty) {
      _errorMessage = 'Email address is missing.';
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await ApiService.verifyOtp(email: targetEmail, otp: otp);
    _isLoading = false;

    if (result['success'] == true) {
      _user = result['user'] as UserModel?;
      _pendingEmail = null;
      _status = AuthStatus.authenticated;
      _errorMessage = null;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message']?.toString() ?? 'OTP verification failed.';
      notifyListeners();
      return false;
    }
  }

  Future<bool> resendOtp({String? email}) async {
    final targetEmail = email ?? _pendingEmail;
    if (targetEmail == null || targetEmail.isEmpty) return false;

    final result = await ApiService.resendOtp(email: targetEmail);
    if (result['success'] == false) {
      _errorMessage = result['message']?.toString();
      notifyListeners();
    }
    return result['success'] == true;
  }

  Future<bool> updateProfile({String? name, String? avatarUrl}) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await ApiService.updateUserProfile(name: name, avatarUrl: avatarUrl);
    _isLoading = false;

    if (result['success'] == true) {
      _user = result['user'] as UserModel?;
      notifyListeners();
      return true;
    } else {
      _errorMessage = result['message']?.toString() ?? 'Failed to update profile.';
      notifyListeners();
      return false;
    }
  }

  Future<void> signOut() async {
    await ApiService.clearAuthSession();
    _user = null;
    _pendingEmail = null;
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  void setPendingEmail(String email) {
    _pendingEmail = email;
    _status = AuthStatus.pendingVerification;
    notifyListeners();
  }

  void cancelVerification() {
    _status = AuthStatus.unauthenticated;
    _errorMessage = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
