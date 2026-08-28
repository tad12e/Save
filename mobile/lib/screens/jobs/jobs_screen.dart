import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import '../../core/theme.dart';
import '../../widgets/app_header.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});

  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  int _selectedStageIndex = 0;
  final List<String> _stages = ['Saved (12)', 'Applied (4)', 'Interview (2)', 'Offer (0)'];

  final List<Map<String, dynamic>> _sampleJobs = [
    {
      'role': 'Senior Frontend & AI Engineer',
      'company': 'Vercel',
      'location': 'Remote (Global)',
      'salary': '\$160,000 - \$190,000',
      'stage': 'Saved',
      'deadline': 'Expires in 3 days',
      'tags': ['React', 'Next.js', 'LLMs'],
    },
    {
      'role': 'Full Stack Developer',
      'company': 'Linear',
      'location': 'San Francisco / Remote',
      'salary': '\$170,000 - \$200,000',
      'stage': 'Saved',
      'deadline': 'Expires in 5 days',
      'tags': ['TypeScript', 'Node', 'GraphQL'],
    },
    {
      'role': 'Staff Systems Architect',
      'company': 'Stripe',
      'location': 'Seattle, WA',
      'salary': '\$210,000 - \$260,000',
      'stage': 'Applied',
      'deadline': 'Applied 2 days ago',
      'tags': ['Rust', 'Distributed Systems'],
    },
    {
      'role': 'AI Research Product Engineer',
      'company': 'Anthropic',
      'location': 'San Francisco, CA',
      'salary': '\$220,000 - \$280,000',
      'stage': 'Interview',
      'deadline': 'Round 2 scheduled',
      'tags': ['Python', 'PyTorch', 'Agents'],
    },
  ];

  @override
  Widget build(BuildContext context) {
    final filteredJobs = _sampleJobs.where((j) {
      if (_selectedStageIndex == 0) return j['stage'] == 'Saved';
      if (_selectedStageIndex == 1) return j['stage'] == 'Applied';
      if (_selectedStageIndex == 2) return j['stage'] == 'Interview';
      return j['stage'] == 'Offer';
    }).toList();

    return Scaffold(
      backgroundColor: AppTheme.background,
      // Variation 2 — List screen header (Jobs)
      appBar: AppHeader.list(
        title: 'Jobs',
        onSearchTap: () {},
        onFilterTap: () {},
      ),
      body: Column(
        children: [
          // Kanban Stage Selector Pills
          Container(
            height: 42,
            margin: const EdgeInsets.symmetric(vertical: 10),
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _stages.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (ctx, idx) {
                final isSelected = _selectedStageIndex == idx;
                return GestureDetector(
                  onTap: () => setState(() => _selectedStageIndex = idx),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? AppTheme.primaryViolet : AppTheme.surfaceCard,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: isSelected ? AppTheme.primaryViolet : AppTheme.borderSubtle,
                        width: 0.5,
                      ),
                    ),
                    child: Text(
                      _stages[idx],
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        color: isSelected ? Colors.white : AppTheme.textMuted,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          // Job Cards List
          Expanded(
            child: filteredJobs.isEmpty
                ? Center(
                    child: Text(
                      'No jobs in this stage',
                      style: GoogleFonts.outfit(color: AppTheme.inactiveGrey, fontSize: 15),
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filteredJobs.length,
                    itemBuilder: (ctx, idx) {
                      final job = filteredJobs[idx];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppTheme.borderSubtle, width: 0.5),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  job['company'],
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryVioletLight,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.amberAlert.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    job['deadline'],
                                    style: GoogleFonts.inter(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                      color: AppTheme.amberAlert,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              job['role'],
                              style: GoogleFonts.outfit(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textWhite,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                const Icon(LucideIcons.mapPin, size: 13, color: AppTheme.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  job['location'],
                                  style: GoogleFonts.inter(fontSize: 11, color: AppTheme.textMuted),
                                ),
                                const SizedBox(width: 14),
                                const Icon(LucideIcons.dollarSign, size: 13, color: AppTheme.trendGreen),
                                const SizedBox(width: 2),
                                Text(
                                  job['salary'],
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: AppTheme.trendGreen,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 6,
                              runSpacing: 4,
                              children: (job['tags'] as List<String>).map((tag) {
                                return Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: AppTheme.background,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    '#$tag',
                                    style: GoogleFonts.inter(fontSize: 10, color: AppTheme.textMuted),
                                  ),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
