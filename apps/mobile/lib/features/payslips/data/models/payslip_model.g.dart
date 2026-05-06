// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'payslip_model.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetCachedPayslipCollection on Isar {
  IsarCollection<CachedPayslip> get cachedPayslips => this.collection();
}

const CachedPayslipSchema = CollectionSchema(
  name: r'CachedPayslip',
  id: -8763924193452594664,
  properties: {
    r'cachedAt': PropertySchema(
      id: 0,
      name: r'cachedAt',
      type: IsarType.dateTime,
    ),
    r'employeeId': PropertySchema(
      id: 1,
      name: r'employeeId',
      type: IsarType.string,
    ),
    r'grossEarnings': PropertySchema(
      id: 2,
      name: r'grossEarnings',
      type: IsarType.double,
    ),
    r'month': PropertySchema(
      id: 3,
      name: r'month',
      type: IsarType.long,
    ),
    r'netPay': PropertySchema(
      id: 4,
      name: r'netPay',
      type: IsarType.double,
    ),
    r'organizationId': PropertySchema(
      id: 5,
      name: r'organizationId',
      type: IsarType.string,
    ),
    r'payslipId': PropertySchema(
      id: 6,
      name: r'payslipId',
      type: IsarType.string,
    ),
    r'pdfUrl': PropertySchema(
      id: 7,
      name: r'pdfUrl',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: 8,
      name: r'status',
      type: IsarType.string,
    ),
    r'totalDeductions': PropertySchema(
      id: 9,
      name: r'totalDeductions',
      type: IsarType.double,
    ),
    r'year': PropertySchema(
      id: 10,
      name: r'year',
      type: IsarType.long,
    )
  },
  estimateSize: _cachedPayslipEstimateSize,
  serialize: _cachedPayslipSerialize,
  deserialize: _cachedPayslipDeserialize,
  deserializeProp: _cachedPayslipDeserializeProp,
  idName: r'id',
  indexes: {
    r'payslipId': IndexSchema(
      id: 2254406253305964377,
      name: r'payslipId',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'payslipId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _cachedPayslipGetId,
  getLinks: _cachedPayslipGetLinks,
  attach: _cachedPayslipAttach,
  version: '3.1.0+1',
);

int _cachedPayslipEstimateSize(
  CachedPayslip object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.employeeId.length * 3;
  bytesCount += 3 + object.organizationId.length * 3;
  bytesCount += 3 + object.payslipId.length * 3;
  {
    final value = object.pdfUrl;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.status.length * 3;
  return bytesCount;
}

void _cachedPayslipSerialize(
  CachedPayslip object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.cachedAt);
  writer.writeString(offsets[1], object.employeeId);
  writer.writeDouble(offsets[2], object.grossEarnings);
  writer.writeLong(offsets[3], object.month);
  writer.writeDouble(offsets[4], object.netPay);
  writer.writeString(offsets[5], object.organizationId);
  writer.writeString(offsets[6], object.payslipId);
  writer.writeString(offsets[7], object.pdfUrl);
  writer.writeString(offsets[8], object.status);
  writer.writeDouble(offsets[9], object.totalDeductions);
  writer.writeLong(offsets[10], object.year);
}

CachedPayslip _cachedPayslipDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = CachedPayslip();
  object.cachedAt = reader.readDateTime(offsets[0]);
  object.employeeId = reader.readString(offsets[1]);
  object.grossEarnings = reader.readDouble(offsets[2]);
  object.id = id;
  object.month = reader.readLong(offsets[3]);
  object.netPay = reader.readDouble(offsets[4]);
  object.organizationId = reader.readString(offsets[5]);
  object.payslipId = reader.readString(offsets[6]);
  object.pdfUrl = reader.readStringOrNull(offsets[7]);
  object.status = reader.readString(offsets[8]);
  object.totalDeductions = reader.readDouble(offsets[9]);
  object.year = reader.readLong(offsets[10]);
  return object;
}

P _cachedPayslipDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTime(offset)) as P;
    case 1:
      return (reader.readString(offset)) as P;
    case 2:
      return (reader.readDouble(offset)) as P;
    case 3:
      return (reader.readLong(offset)) as P;
    case 4:
      return (reader.readDouble(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readStringOrNull(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readDouble(offset)) as P;
    case 10:
      return (reader.readLong(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _cachedPayslipGetId(CachedPayslip object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _cachedPayslipGetLinks(CachedPayslip object) {
  return [];
}

void _cachedPayslipAttach(
    IsarCollection<dynamic> col, Id id, CachedPayslip object) {
  object.id = id;
}

extension CachedPayslipByIndex on IsarCollection<CachedPayslip> {
  Future<CachedPayslip?> getByPayslipId(String payslipId) {
    return getByIndex(r'payslipId', [payslipId]);
  }

  CachedPayslip? getByPayslipIdSync(String payslipId) {
    return getByIndexSync(r'payslipId', [payslipId]);
  }

  Future<bool> deleteByPayslipId(String payslipId) {
    return deleteByIndex(r'payslipId', [payslipId]);
  }

  bool deleteByPayslipIdSync(String payslipId) {
    return deleteByIndexSync(r'payslipId', [payslipId]);
  }

  Future<List<CachedPayslip?>> getAllByPayslipId(List<String> payslipIdValues) {
    final values = payslipIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'payslipId', values);
  }

  List<CachedPayslip?> getAllByPayslipIdSync(List<String> payslipIdValues) {
    final values = payslipIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'payslipId', values);
  }

  Future<int> deleteAllByPayslipId(List<String> payslipIdValues) {
    final values = payslipIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'payslipId', values);
  }

  int deleteAllByPayslipIdSync(List<String> payslipIdValues) {
    final values = payslipIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'payslipId', values);
  }

  Future<Id> putByPayslipId(CachedPayslip object) {
    return putByIndex(r'payslipId', object);
  }

  Id putByPayslipIdSync(CachedPayslip object, {bool saveLinks = true}) {
    return putByIndexSync(r'payslipId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByPayslipId(List<CachedPayslip> objects) {
    return putAllByIndex(r'payslipId', objects);
  }

  List<Id> putAllByPayslipIdSync(List<CachedPayslip> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'payslipId', objects, saveLinks: saveLinks);
  }
}

extension CachedPayslipQueryWhereSort
    on QueryBuilder<CachedPayslip, CachedPayslip, QWhere> {
  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension CachedPayslipQueryWhere
    on QueryBuilder<CachedPayslip, CachedPayslip, QWhereClause> {
  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause> idEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause> idNotEqualTo(
      Id id) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            )
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            );
      } else {
        return query
            .addWhereClause(
              IdWhereClause.greaterThan(lower: id, includeLower: false),
            )
            .addWhereClause(
              IdWhereClause.lessThan(upper: id, includeUpper: false),
            );
      }
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause> idGreaterThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause> idLessThan(
      Id id,
      {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause> idBetween(
    Id lowerId,
    Id upperId, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: lowerId,
        includeLower: includeLower,
        upper: upperId,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause>
      payslipIdEqualTo(String payslipId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'payslipId',
        value: [payslipId],
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterWhereClause>
      payslipIdNotEqualTo(String payslipId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'payslipId',
              lower: [],
              upper: [payslipId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'payslipId',
              lower: [payslipId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'payslipId',
              lower: [payslipId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'payslipId',
              lower: [],
              upper: [payslipId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension CachedPayslipQueryFilter
    on QueryBuilder<CachedPayslip, CachedPayslip, QFilterCondition> {
  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      cachedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      cachedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      cachedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      cachedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'cachedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'employeeId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'employeeId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'employeeId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      employeeIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'employeeId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      grossEarningsEqualTo(
    double value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'grossEarnings',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      grossEarningsGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'grossEarnings',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      grossEarningsLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'grossEarnings',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      grossEarningsBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'grossEarnings',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition> idEqualTo(
      Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      idGreaterThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition> idLessThan(
    Id value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition> idBetween(
    Id lower,
    Id upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'id',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      monthEqualTo(int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'month',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      monthGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'month',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      monthLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'month',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      monthBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'month',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      netPayEqualTo(
    double value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'netPay',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      netPayGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'netPay',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      netPayLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'netPay',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      netPayBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'netPay',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'organizationId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'organizationId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'organizationId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      organizationIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'organizationId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'payslipId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'payslipId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'payslipId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'payslipId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'payslipId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'payslipId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'payslipId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'payslipId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'payslipId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      payslipIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'payslipId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'pdfUrl',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'pdfUrl',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'pdfUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'pdfUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'pdfUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'pdfUrl',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'pdfUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'pdfUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'pdfUrl',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'pdfUrl',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'pdfUrl',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      pdfUrlIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'pdfUrl',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'status',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'status',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      totalDeductionsEqualTo(
    double value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'totalDeductions',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      totalDeductionsGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'totalDeductions',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      totalDeductionsLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'totalDeductions',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      totalDeductionsBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'totalDeductions',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition> yearEqualTo(
      int value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'year',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      yearGreaterThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'year',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition>
      yearLessThan(
    int value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'year',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterFilterCondition> yearBetween(
    int lower,
    int upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'year',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension CachedPayslipQueryObject
    on QueryBuilder<CachedPayslip, CachedPayslip, QFilterCondition> {}

extension CachedPayslipQueryLinks
    on QueryBuilder<CachedPayslip, CachedPayslip, QFilterCondition> {}

extension CachedPayslipQuerySortBy
    on QueryBuilder<CachedPayslip, CachedPayslip, QSortBy> {
  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByEmployeeId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByEmployeeIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByGrossEarnings() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'grossEarnings', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByGrossEarningsDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'grossEarnings', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByMonth() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'month', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByMonthDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'month', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByNetPay() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'netPay', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByNetPayDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'netPay', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByOrganizationId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByOrganizationIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByPayslipId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'payslipId', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByPayslipIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'payslipId', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByPdfUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pdfUrl', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByPdfUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pdfUrl', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByTotalDeductions() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDeductions', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      sortByTotalDeductionsDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDeductions', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'year', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> sortByYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'year', Sort.desc);
    });
  }
}

extension CachedPayslipQuerySortThenBy
    on QueryBuilder<CachedPayslip, CachedPayslip, QSortThenBy> {
  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByEmployeeId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByEmployeeIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByGrossEarnings() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'grossEarnings', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByGrossEarningsDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'grossEarnings', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByMonth() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'month', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByMonthDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'month', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByNetPay() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'netPay', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByNetPayDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'netPay', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByOrganizationId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByOrganizationIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByPayslipId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'payslipId', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByPayslipIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'payslipId', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByPdfUrl() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pdfUrl', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByPdfUrlDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'pdfUrl', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByTotalDeductions() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDeductions', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy>
      thenByTotalDeductionsDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDeductions', Sort.desc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'year', Sort.asc);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QAfterSortBy> thenByYearDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'year', Sort.desc);
    });
  }
}

extension CachedPayslipQueryWhereDistinct
    on QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> {
  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'cachedAt');
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByEmployeeId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'employeeId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct>
      distinctByGrossEarnings() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'grossEarnings');
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByMonth() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'month');
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByNetPay() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'netPay');
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct>
      distinctByOrganizationId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'organizationId',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByPayslipId(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'payslipId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByPdfUrl(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'pdfUrl', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByStatus(
      {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct>
      distinctByTotalDeductions() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'totalDeductions');
    });
  }

  QueryBuilder<CachedPayslip, CachedPayslip, QDistinct> distinctByYear() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'year');
    });
  }
}

extension CachedPayslipQueryProperty
    on QueryBuilder<CachedPayslip, CachedPayslip, QQueryProperty> {
  QueryBuilder<CachedPayslip, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<CachedPayslip, DateTime, QQueryOperations> cachedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'cachedAt');
    });
  }

  QueryBuilder<CachedPayslip, String, QQueryOperations> employeeIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'employeeId');
    });
  }

  QueryBuilder<CachedPayslip, double, QQueryOperations>
      grossEarningsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'grossEarnings');
    });
  }

  QueryBuilder<CachedPayslip, int, QQueryOperations> monthProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'month');
    });
  }

  QueryBuilder<CachedPayslip, double, QQueryOperations> netPayProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'netPay');
    });
  }

  QueryBuilder<CachedPayslip, String, QQueryOperations>
      organizationIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizationId');
    });
  }

  QueryBuilder<CachedPayslip, String, QQueryOperations> payslipIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'payslipId');
    });
  }

  QueryBuilder<CachedPayslip, String?, QQueryOperations> pdfUrlProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'pdfUrl');
    });
  }

  QueryBuilder<CachedPayslip, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<CachedPayslip, double, QQueryOperations>
      totalDeductionsProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'totalDeductions');
    });
  }

  QueryBuilder<CachedPayslip, int, QQueryOperations> yearProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'year');
    });
  }
}
