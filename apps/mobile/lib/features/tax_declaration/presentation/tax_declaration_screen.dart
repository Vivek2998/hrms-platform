import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/tax_declaration_model.dart';
import '../providers/tax_declaration_provider.dart';

class TaxDeclarationScreen extends ConsumerStatefulWidget {
  const TaxDeclarationScreen({super.key});

  @override
  ConsumerState<TaxDeclarationScreen> createState() => _TaxDeclarationScreenState();
}

class _TaxDeclarationScreenState extends ConsumerState<TaxDeclarationScreen> {
  late String _fy;
  String _regime = 'NEW';
  bool _dirty = false;
  bool _saving = false;

  // 80C controllers
  late final TextEditingController _ppf, _epf, _elss, _lic, _nsc,
      _homeLoanPrincipal, _tuitionFees, _sukanya;
  // 80D
  late final TextEditingController _hiSelf, _hiParents;
  // HRA
  late final TextEditingController _rent, _landlordPan;
  // Others
  late final TextEditingController _nps, _homeLoanInt, _savings;

  @override
  void initState() {
    super.initState();
    _fy = currentFinancialYear();
    _ppf = _ctrl();
    _epf = _ctrl();
    _elss = _ctrl();
    _lic = _ctrl();
    _nsc = _ctrl();
    _homeLoanPrincipal = _ctrl();
    _tuitionFees = _ctrl();
    _sukanya = _ctrl();
    _hiSelf = _ctrl();
    _hiParents = _ctrl();
    _rent = _ctrl();
    _landlordPan = TextEditingController();
    _nps = _ctrl();
    _homeLoanInt = _ctrl();
    _savings = _ctrl();
  }

  TextEditingController _ctrl() => TextEditingController(text: '0');

  @override
  void dispose() {
    for (final c in [
      _ppf, _epf, _elss, _lic, _nsc, _homeLoanPrincipal, _tuitionFees,
      _sukanya, _hiSelf, _hiParents, _rent, _landlordPan, _nps, _homeLoanInt, _savings,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _populateFrom(TaxDeclaration d) {
    _regime = d.regime;
    _ppf.text = d.ppf.toStringAsFixed(0);
    _epf.text = d.epf.toStringAsFixed(0);
    _elss.text = d.elss.toStringAsFixed(0);
    _lic.text = d.lic.toStringAsFixed(0);
    _nsc.text = d.nsc.toStringAsFixed(0);
    _homeLoanPrincipal.text = d.homeLoanPrincipal.toStringAsFixed(0);
    _tuitionFees.text = d.tuitionFees.toStringAsFixed(0);
    _sukanya.text = d.sukanyaSamriddhi.toStringAsFixed(0);
    _hiSelf.text = d.healthInsuranceSelf.toStringAsFixed(0);
    _hiParents.text = d.healthInsuranceParents.toStringAsFixed(0);
    _rent.text = d.rentPaid.toStringAsFixed(0);
    _landlordPan.text = d.landlordPan ?? '';
    _nps.text = d.npsEmployee.toStringAsFixed(0);
    _homeLoanInt.text = d.homeLoanInterest.toStringAsFixed(0);
    _savings.text = d.savingsInterest.toStringAsFixed(0);
  }

  double _v(TextEditingController c) => double.tryParse(c.text) ?? 0;

  double get _sec80C {
    final raw = _v(_ppf) + _v(_epf) + _v(_elss) + _v(_lic) + _v(_nsc) +
        _v(_homeLoanPrincipal) + _v(_tuitionFees) + _v(_sukanya);
    return raw.clamp(0, 150000);
  }

  double get _sec80D => _v(_hiSelf) + _v(_hiParents);
  double get _npsVal => _v(_nps).clamp(0, 50000);
  double get _homeLoanIntVal => _v(_homeLoanInt).clamp(0, 200000);
  double get _savingsVal => _v(_savings).clamp(0, 10000);
  double get _total => _sec80C + _sec80D + _v(_rent) + _npsVal + _homeLoanIntVal + _savingsVal;

  Future<void> _save(TaxDeclaration? existing, {bool submit = false}) async {
    setState(() => _saving = true);
    try {
      await ref.read(taxDeclarationNotifierProvider.notifier).save(
            financialYear: _fy,
            regime: _regime,
            ppf: _v(_ppf),
            epf: _v(_epf),
            elss: _v(_elss),
            lic: _v(_lic),
            nsc: _v(_nsc),
            homeLoanPrincipal: _v(_homeLoanPrincipal),
            tuitionFees: _v(_tuitionFees),
            sukanyaSamriddhi: _v(_sukanya),
            healthInsuranceSelf: _v(_hiSelf),
            healthInsuranceParents: _v(_hiParents),
            rentPaid: _v(_rent),
            landlordPan: _landlordPan.text.trim().isEmpty ? null : _landlordPan.text.trim(),
            npsEmployee: _v(_nps),
            homeLoanInterest: _v(_homeLoanInt),
            savingsInterest: _v(_savings),
          );
      // After saving, submit if requested
      if (submit) {
        final updated = await ref.read(myTaxDeclarationProvider(financialYear: _fy).future);
        if (updated != null) {
          await ref.read(taxDeclarationNotifierProvider.notifier).submit(updated.id);
        }
      }
      if (mounted) {
        setState(() => _dirty = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(submit ? 'Submitted to HR' : 'Draft saved'),
          backgroundColor: Colors.green,
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final declarationAsync = ref.watch(myTaxDeclarationProvider(financialYear: _fy));

    return declarationAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('IT Declaration')),
        body: const Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('IT Declaration')),
        body: Center(child: Text('Error: $e')),
      ),
      data: (declaration) {
        // Populate fields once when data loads (not on every rebuild)
        if (declaration != null && !_dirty) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (mounted) _populateFrom(declaration);
          });
        }

        final isReadOnly = declaration != null && declaration.status != 'DRAFT';
        final status = declaration?.status ?? 'DRAFT';

        return Scaffold(
          appBar: AppBar(
            title: const Text('IT Declaration'),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: _FYSelector(
                  current: _fy,
                  onChanged: (fy) => setState(() {
                    _fy = fy;
                    _dirty = false;
                  }),
                ),
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Status banner
              _StatusBanner(status: status, declaration: declaration, scheme: scheme),
              const SizedBox(height: 16),

              // Regime selector
              _RegimeSelector(
                selected: _regime,
                readOnly: isReadOnly,
                onChanged: (r) => setState(() {
                  _regime = r;
                  _dirty = true;
                }),
                scheme: scheme,
              ),
              const SizedBox(height: 20),

              if (_regime == 'OLD') ...[
                // Section 80C
                _SectionCard(
                  title: 'Section 80C',
                  subtitle: 'Max ₹1,50,000',
                  icon: Icons.account_balance_outlined,
                  color: Colors.indigo,
                  total: _sec80C,
                  cap: 150000,
                  children: [
                    _AmountField('PPF', _ppf, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('EPF (Voluntary)', _epf, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('ELSS / Mutual Funds', _elss, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('LIC Premium', _lic, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('NSC', _nsc, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('Home Loan Principal', _homeLoanPrincipal, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('Tuition Fees', _tuitionFees, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('Sukanya Samriddhi', _sukanya, readOnly: isReadOnly, onChanged: _markDirty),
                  ],
                ),
                const SizedBox(height: 16),

                // Section 80D
                _SectionCard(
                  title: 'Section 80D',
                  subtitle: 'Health Insurance',
                  icon: Icons.health_and_safety_outlined,
                  color: Colors.green,
                  total: _sec80D,
                  children: [
                    _AmountField('Self & Family Premium', _hiSelf, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('Parents Premium', _hiParents, readOnly: isReadOnly, onChanged: _markDirty),
                  ],
                ),
                const SizedBox(height: 16),

                // HRA
                _SectionCard(
                  title: 'HRA',
                  subtitle: 'House Rent Allowance',
                  icon: Icons.home_outlined,
                  color: Colors.orange,
                  total: _v(_rent),
                  children: [
                    _AmountField('Annual Rent Paid', _rent, readOnly: isReadOnly, onChanged: _markDirty),
                    _TextField('Landlord PAN (if rent > ₹1L/yr)', _landlordPan,
                        readOnly: isReadOnly, onChanged: (_) => _markDirty()),
                  ],
                ),
                const SizedBox(height: 16),

                // Other deductions
                _SectionCard(
                  title: 'Other Deductions',
                  subtitle: 'NPS, Home Loan, Savings',
                  icon: Icons.savings_outlined,
                  color: Colors.teal,
                  total: _npsVal + _homeLoanIntVal + _savingsVal,
                  children: [
                    _AmountField('NPS 80CCD(1B) — max ₹50,000', _nps, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('Home Loan Interest 24(b) — max ₹2,00,000', _homeLoanInt, readOnly: isReadOnly, onChanged: _markDirty),
                    _AmountField('Savings Interest 80TTA — max ₹10,000', _savings, readOnly: isReadOnly, onChanged: _markDirty),
                  ],
                ),
                const SizedBox(height: 20),

                // Summary
                _SummaryCard(
                  sec80C: _sec80C,
                  sec80D: _sec80D,
                  hra: _v(_rent),
                  nps: _npsVal,
                  homeLoanInt: _homeLoanIntVal,
                  savings: _savingsVal,
                  total: _total,
                  scheme: scheme,
                ),
                const SizedBox(height: 24),
              ] else ...[
                // NEW regime info
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Icon(Icons.info_outline, color: scheme.primary, size: 20),
                          const SizedBox(width: 8),
                          const Text('New Regime',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                        ]),
                        const SizedBox(height: 10),
                        Text(
                          'Under the New Tax Regime, most deductions (80C, 80D, HRA) are not applicable. '
                          'You benefit from lower flat tax slabs instead.',
                          style: TextStyle(color: scheme.onSurfaceVariant, fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Actions
              if (!isReadOnly) ...[
                Row(children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _saving ? null : () => _save(declaration),
                      child: _saving
                          ? const SizedBox(height: 18, width: 18,
                              child: CircularProgressIndicator(strokeWidth: 2))
                          : const Text('Save Draft'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: _saving ? null : () => _save(declaration, submit: true),
                      child: const Text('Submit to HR'),
                    ),
                  ),
                ]),
              ],
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  void _markDirty() => setState(() => _dirty = true);
}

// ── FY Selector ───────────────────────────────────────────────────────────────

class _FYSelector extends StatelessWidget {
  final String current;
  final ValueChanged<String> onChanged;
  const _FYSelector({required this.current, required this.onChanged});

  List<String> _fyOptions() {
    final now = DateTime.now();
    final baseYear = now.month >= 4 ? now.year : now.year - 1;
    return [baseYear - 1, baseYear, baseYear + 1]
        .map((y) => '$y-${(y + 1).toString().substring(2)}')
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final options = _fyOptions();
    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        value: options.contains(current) ? current : options[1],
        isDense: true,
        items: options
            .map((fy) => DropdownMenuItem(value: fy, child: Text('FY $fy')))
            .toList(),
        onChanged: (v) {
          if (v != null) onChanged(v);
        },
        style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.primary),
      ),
    );
  }
}

// ── Regime Selector ───────────────────────────────────────────────────────────

class _RegimeSelector extends StatelessWidget {
  final String selected;
  final bool readOnly;
  final ValueChanged<String> onChanged;
  final ColorScheme scheme;
  const _RegimeSelector({
    required this.selected,
    required this.readOnly,
    required this.onChanged,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: ['NEW', 'OLD'].map((r) {
        final active = selected == r;
        return Expanded(
          child: GestureDetector(
            onTap: readOnly ? null : () => onChanged(r),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              margin: r == 'NEW'
                  ? const EdgeInsets.only(right: 6)
                  : const EdgeInsets.only(left: 6),
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: active ? scheme.primaryContainer : scheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: active ? scheme.primary : scheme.outline.withValues(alpha: 0.4),
                  width: active ? 2 : 1,
                ),
              ),
              child: Column(
                children: [
                  Text(r == 'NEW' ? 'New Regime' : 'Old Regime',
                      style: TextStyle(
                          fontWeight: FontWeight.w700,
                          color: active ? scheme.primary : scheme.onSurface)),
                  const SizedBox(height: 2),
                  Text(
                    r == 'NEW' ? 'Lower slabs, no deductions' : 'Higher slabs, with deductions',
                    style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

// ── Section Card ──────────────────────────────────────────────────────────────

class _SectionCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final double total;
  final double? cap;
  final List<Widget> children;

  const _SectionCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.total,
    this.cap,
    required this.children,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, color: color, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      Text(subtitle,
                          style: TextStyle(fontSize: 11, color: scheme.onSurfaceVariant)),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('₹${_fmt(total)}',
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: color,
                            fontSize: 14)),
                    if (cap != null)
                      Text('/ ₹${_fmt(cap!)}',
                          style: TextStyle(fontSize: 10, color: scheme.onSurfaceVariant)),
                  ],
                ),
              ],
            ),
            const Divider(height: 20),
            ...children,
          ],
        ),
      ),
    );
  }

  String _fmt(double v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(0)}K';
    return v.toStringAsFixed(0);
  }
}

// ── Amount Field ──────────────────────────────────────────────────────────────

class _AmountField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool readOnly;
  final VoidCallback onChanged;
  const _AmountField(this.label, this.controller,
      {required this.readOnly, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          labelText: label,
          prefixText: '₹ ',
          isDense: true,
          border: const OutlineInputBorder(),
        ),
        onChanged: (_) => onChanged(),
      ),
    );
  }
}

class _TextField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool readOnly;
  final ValueChanged<String> onChanged;
  const _TextField(this.label, this.controller,
      {required this.readOnly, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        readOnly: readOnly,
        textCapitalization: TextCapitalization.characters,
        decoration: InputDecoration(
          labelText: label,
          isDense: true,
          border: const OutlineInputBorder(),
        ),
        onChanged: onChanged,
      ),
    );
  }
}

// ── Summary Card ──────────────────────────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  final double sec80C, sec80D, hra, nps, homeLoanInt, savings, total;
  final ColorScheme scheme;
  const _SummaryCard({
    required this.sec80C,
    required this.sec80D,
    required this.hra,
    required this.nps,
    required this.homeLoanInt,
    required this.savings,
    required this.total,
    required this.scheme,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.primaryContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: scheme.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Summary',
              style: TextStyle(fontWeight: FontWeight.w700, color: scheme.primary)),
          const SizedBox(height: 12),
          _summaryRow('Section 80C', sec80C),
          _summaryRow('Section 80D', sec80D),
          _summaryRow('HRA', hra),
          _summaryRow('NPS 80CCD(1B)', nps),
          _summaryRow('Home Loan Interest', homeLoanInt),
          _summaryRow('Savings Interest', savings),
          const Divider(height: 16),
          Row(
            children: [
              const Text('Total Deductions',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const Spacer(),
              Text('₹${_fmt(total)}',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      color: scheme.primary)),
            ],
          ),
          const SizedBox(height: 4),
          Text('Estimated tax saved (30%): ₹${_fmt(total * 0.3)}',
              style: TextStyle(fontSize: 12, color: scheme.onSurfaceVariant)),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, double value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(
          children: [
            Text(label, style: TextStyle(fontSize: 13, color: scheme.onSurfaceVariant)),
            const Spacer(),
            Text('₹${_fmt(value)}',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      );

  String _fmt(double v) {
    if (v >= 100000) return '${(v / 100000).toStringAsFixed(1)}L';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(0)}K';
    return v.toStringAsFixed(0);
  }
}

// ── Status Banner ─────────────────────────────────────────────────────────────

class _StatusBanner extends StatelessWidget {
  final String status;
  final TaxDeclaration? declaration;
  final ColorScheme scheme;
  const _StatusBanner(
      {required this.status, required this.declaration, required this.scheme});

  @override
  Widget build(BuildContext context) {
    final (color, icon, message) = switch (status) {
      'SUBMITTED' => (
          Colors.blue,
          Icons.schedule,
          'Submitted — pending HR verification'
        ),
      'VERIFIED' => (
          Colors.green,
          Icons.verified,
          'Verified by HR'
        ),
      _ => (
          Colors.orange,
          Icons.edit_note,
          'Draft — not yet submitted'
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 10),
          Text(message,
              style: TextStyle(fontSize: 13, color: color, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
