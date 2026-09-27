import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/clips_provider.dart';
import '../auth/sign_in_screen.dart';

class PersonalInfoScreen extends StatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  State<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends State<PersonalInfoScreen> {
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  bool _isEditing = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final auth = Provider.of<AuthProvider>(context, listen: false);
    _nameController = TextEditingController(text: auth.user?.name ?? 'Alex Miller');
    _emailController = TextEditingController(text: auth.user?.email ?? 'guest@save.pro');
    _nameController.addListener(() {
      if (_isEditing) setState(() {});
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleSave(AuthProvider auth) async {
    final newName = _nameController.text.trim();
    if (newName.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Name cannot be empty.'),
          backgroundColor: AppTheme.urgencyRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      return;
    }

    if (newName == auth.user?.name) {
      setState(() => _isEditing = false);
      return;
    }

    setState(() => _isSaving = true);
    final ok = await auth.updateProfile(name: newName);
    if (!mounted) return;

    setState(() => _isSaving = false);

    if (ok) {
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Profile details updated ✓'),
          backgroundColor: const Color(0xFF2D6A4F),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(auth.errorMessage ?? 'Failed to update profile. Please try again.'),
          backgroundColor: AppTheme.urgencyRed,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isGuest = !auth.isAuthenticated;
    final clipsProvider = Provider.of<ClipsProvider>(context);
    final totalClips = clipsProvider.clips.isNotEmpty ? clipsProvider.clips.length : 48;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft, color: AppTheme.textPrimary, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Personal Information',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        actions: [
          if (!isGuest)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: _isSaving
                  ? const Center(
                      child: SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFF2D6A4F),
                        ),
                      ),
                    )
                  : TextButton(
                      onPressed: () {
                        if (_isEditing) {
                          _handleSave(auth);
                        } else {
                          setState(() => _isEditing = true);
                        }
                      },
                      child: Text(
                        _isEditing ? 'Save' : 'Edit',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF2D6A4F),
                        ),
                      ),
                    ),
            ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Guest Mode Notice Banner
            if (isGuest) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7), // Amber-50
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFFDE68A), width: 1.0),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(LucideIcons.userX, size: 18, color: Color(0xFFD97706)),
                        const SizedBox(width: 8),
                        Text(
                          'You are in Guest Mode',
                          style: GoogleFonts.outfit(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF92400E),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Your clips and notes are currently stored locally. Create an account to sync across devices.',
                      style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF92400E), height: 1.4),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      height: 38,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2D6A4F),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (_) => const SignInScreen()),
                          );
                        },
                        child: Text(
                          'Sign In or Create Account',
                          style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),
            ],

            // Avatar Section
            Center(
              child: Stack(
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF2D6A4F), Color(0xFF40916C)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(40),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF2D6A4F).withValues(alpha: 0.2),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Center(
                      child: Text(
                        isGuest
                            ? 'G'
                            : (_nameController.text.trim().isNotEmpty
                                ? _nameController.text.trim()[0].toUpperCase()
                                : (auth.user != null && auth.user!.name.trim().isNotEmpty
                                    ? auth.user!.name.trim()[0].toUpperCase()
                                    : 'U')),
                        style: GoogleFonts.outfit(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  if (!isGuest && _isEditing)
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: const Icon(LucideIcons.pencil, size: 14, color: Color(0xFF2D6A4F)),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            // Profile Fields Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Full Name
                  _buildFieldLabel('FULL NAME'),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _nameController,
                    enabled: _isEditing && !isGuest,
                    style: GoogleFonts.inter(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: _inputDecoration('e.g. Alex Miller', LucideIcons.user),
                  ),
                  const SizedBox(height: 16),

                  // Email
                  _buildFieldLabel('EMAIL ADDRESS'),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _emailController,
                    enabled: false, // Email changes handled via verification
                    style: GoogleFonts.inter(fontSize: 13, color: isGuest ? AppTheme.inactiveGrey : AppTheme.textPrimary),
                    decoration: _inputDecoration('alex@save.pro', LucideIcons.mail),
                  ),
                  const SizedBox(height: 16),

                  // Account Status Pill
                  _buildFieldLabel('ACCOUNT STATUS'),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: isGuest ? const Color(0xFFFEF3C7) : const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isGuest ? LucideIcons.userX : LucideIcons.circleCheck,
                          size: 16,
                          color: isGuest ? const Color(0xFFD97706) : const Color(0xFF16A34A),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          isGuest ? 'Guest Session (Not Synced)' : 'Verified Vault Member',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isGuest ? const Color(0xFF92400E) : const Color(0xFF16A34A),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Vault Statistics Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Vault Storage Overview',
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatColumn('$totalClips', 'Saved Items'),
                      Container(width: 1, height: 32, color: const Color(0xFFF1F5F9)),
                      _buildStatColumn('6', 'Collections'),
                      Container(width: 1, height: 32, color: const Color(0xFFF1F5F9)),
                      _buildStatColumn('187d', 'Save Streak'),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Text(
      label,
      style: GoogleFonts.inter(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.6,
        color: AppTheme.textMuted,
      ),
    );
  }

  Widget _buildStatColumn(String number, String label) {
    return Column(
      children: [
        Text(
          number,
          style: GoogleFonts.outfit(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF2D6A4F),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 11,
            color: AppTheme.textMuted,
          ),
        ),
      ],
    );
  }

  InputDecoration _inputDecoration(String hint, IconData icon) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      prefixIcon: Icon(icon, size: 16, color: const Color(0xFF2D6A4F)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppTheme.borderSubtle),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: AppTheme.borderSubtle),
      ),
      disabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: Color(0xFF2D6A4F)),
      ),
    );
  }
}
