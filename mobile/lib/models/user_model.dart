class UserModel {
  final dynamic id;
  final String email;
  final String name;
  final String? avatarUrl;
  final String authProvider;
  final bool isEmailVerified;
  final DateTime? createdAt;

  UserModel({
    this.id,
    required this.email,
    required this.name,
    this.avatarUrl,
    this.authProvider = 'email',
    this.isEmailVerified = false,
    this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'] ?? '',
      name: json['name'] ?? '',
      avatarUrl: json['avatar_url'],
      authProvider: json['auth_provider'] ?? 'email',
      isEmailVerified: json['is_email_verified'] ?? false,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'name': name,
      'avatar_url': avatarUrl,
      'auth_provider': authProvider,
      'is_email_verified': isEmailVerified,
      'created_at': createdAt?.toIso8601String(),
    };
  }

  UserModel copyWith({
    dynamic id,
    String? email,
    String? name,
    String? avatarUrl,
    String? authProvider,
    bool? isEmailVerified,
    DateTime? createdAt,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      name: name ?? this.name,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      authProvider: authProvider ?? this.authProvider,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
