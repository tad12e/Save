import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:provider/provider.dart';

import '../../core/theme.dart';
import '../../providers/auth_provider.dart';

class SecurityScreen extends StatefulWidget {
  const SecurityScreen({super.key});

  @override
  State<SecurityScreen> createState() => _SecurityScreenState();
}

class _SecurityScreenState extends State<SecurityScreen> {
  final _currentPassController = TextEditingController();
  final _newPassController = TextEditingController();
  final _confirmPassController = TextEditingController();
  bool _twoFactorEnabled = true;
  bool _obscureCurrent = true;
  bool _obscureNew = true;

  @override
  void dispose() {
    _currentPassController.dispose();
    _newPassController.dispose();
    _confirmPassController.dispose();
    super.dispose();
  }

  void _handleChangePassword() {
    if (_newPassController.text.isEmpty || _currentPassController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Please fill out all password fields.'),
          backgroundColor: AppTheme.urgencyRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    if (_newPassController.text != _confirmPassController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('New passwords do not match.'),
          backgroundColor: AppTheme.urgencyRed,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    _currentPassController.clear();
    _newPassController.clear();
    _confirmPassController.clear();

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: const Text('Password changed successfully ✓'),
        backgroundColor: const Color(0xFF2D6A4F),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final isGuest = !auth.isAuthenticated;

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
          'Security & Privacy',
          style: GoogleFonts.outfit(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section 1: Two-Factor Authentication
            _buildSectionTitle('TWO-FACTOR AUTHENTICATION (2FA)'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
              ),
              child: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: const Color(0xFFDCFCE7),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(LucideIcons.shieldCheck, size: 18, color: Color(0xFF16A34A)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Email OTP Verification',
                          style: GoogleFonts.outfit(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'Requires 6-digit OTP code on new logins',
                          style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: _twoFactorEnabled,
                    activeColor: const Color(0xFF2D6A4F),
                    activeTrackColor: const Color(0xFF86EFAC),
                    onChanged: (val) {
                      setState(() => _twoFactorEnabled = val);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(val ? '2FA enabled' : '2FA disabled'),
                          backgroundColor: const Color(0xFF2D6A4F),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            // Section 2: Change Password
            if (!isGuest) ...[
              _buildSectionTitle('CHANGE PASSWORD'),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('CURRENT PASSWORD', style: _labelStyle()),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _currentPassController,
                      obscureText: _obscureCurrent,
                      style: GoogleFonts.inter(fontSize: 13),
                      decoration: _passDecoration(
                        '••••••••',
                        _obscureCurrent,
                        () => setState(() => _obscureCurrent = !_obscureCurrent),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text('NEW PASSWORD', style: _labelStyle()),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _newPassController,
                      obscureText: _obscureNew,
                      style: GoogleFonts.inter(fontSize: 13),
                      decoration: _passDecoration(
                        'At least 6 characters',
                        _obscureNew,
                        () => setState(() => _obscureNew = !_obscureNew),
                      ),
                    ),
                    const SizedBox(height: 14),
                    Text('CONFIRM NEW PASSWORD', style: _labelStyle()),
                    const SizedBox(height: 6),
                    TextFormField(
                      controller: _confirmPassController,
                      obscureText: _obscureNew,
                      style: GoogleFonts.inter(fontSize: 13),
                      decoration: _passDecoration(
                        '••••••••',
                        _obscureNew,
                        () => setState(() => _obscureNew = !_obscureNew),
                      ),
                    ),
                    const SizedBox(height: 18),
                    SizedBox(
                      width: double.infinity,
                      height: 44,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2D6A4F),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: _handleChangePassword,
                        child: Text(
                          'Update Password',
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 22),
            ],

            // Section 3: Active Devices & Sessions
            _buildSectionTitle('ACTIVE SESSIONS & DEVICES'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
              ),
              child: Column(
                children: [
                  _buildDeviceRow(
                    icon: LucideIcons.smartphone,
                    deviceName: 'Android Mobile App',
                    ipAddress: 'Emulator (10.0.2.2)',
                    isActiveNow: true,
                  ),
                  const Divider(height: 20, color: Color(0xFFF1F5F9)),
                  _buildDeviceRow(
                    icon: LucideIcons.laptop,
                    deviceName: 'Chrome Extension & Web',
                    ipAddress: 'Localhost (Port 3000)',
                    isActiveNow: false,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),

            // Section 4: Data & Cache
            _buildSectionTitle('DATA & PRIVACY'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.borderSubtle, width: 1.0),
              ),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Local cache cleared (14.2 MB freed) ✓'),
                          backgroundColor: Color(0xFF2D6A4F),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(LucideIcons.trash2, size: 16, color: AppTheme.textMuted),
                            const SizedBox(width: 10),
                            Text(
                              'Clear Local Cache',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                          ],
                        ),
                        Text(
                          '14.2 MB',
                          style: GoogleFonts.inter(fontSize: 12, color: AppTheme.textMuted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.6,
          color: AppTheme.textMuted,
        ),
      ),
    );
  }

  TextStyle _labelStyle() {
    return GoogleFonts.inter(
      fontSize: 10,
      fontWeight: FontWeight.w600,
      letterSpacing: 0.6,
      color: AppTheme.textMuted,
    );
  }

  InputDecoration _passDecoration(String hint, bool obscure, VoidCallback toggle) {
    return InputDecoration(
      hintText: hint,
      hintStyle: GoogleFonts.inter(color: AppTheme.inactiveGrey),
      filled: true,
      fillColor: const Color(0xFFF8FAFC),
      prefixIcon: const Icon(LucideIcons.lock, size: 16, color: Color(0xFF2D6A4F)),
      suffixIcon: IconButton(
        icon: Icon(obscure ? LucideIcons.eyeOff : LucideIcons.eye, size: 16, color: AppTheme.inactiveGrey),
        onPressed: toggle,
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderSubtle)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppTheme.borderSubtle)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF2D6A4F))),
    );
  }

  Widget _buildDeviceRow({
    required IconData icon,
    required String deviceName,
    required String ipAddress,
    required bool isActiveNow,
  }) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.textPrimary),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                deviceName,
                style: GoogleFonts.outfit(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                ipAddress,
                style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
              ),
            ],
          ),
        ),
        if (isActiveNow)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0xFFDCFCE7),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: Color(0xFF16A34A),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 4),
                Text(
                  'Active Now',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF16A34A),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
