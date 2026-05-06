// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_model.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetCachedAttendanceRecordCollection on Isar {
  IsarCollection<CachedAttendanceRecord> get cachedAttendanceRecords =>
      this.collection();
}

const CachedAttendanceRecordSchema = CollectionSchema(
  name: r'CachedAttendanceRecord',
  id: 810978612657959600,
  properties: {
    r'cachedAt': PropertySchema(
      id: 0,
      name: r'cachedAt',
      type: IsarType.dateTime,
    ),
    r'date': PropertySchema(
      id: 1,
      name: r'date',
      type: IsarType.dateTime,
    ),
    r'employeeId': PropertySchema(
      id: 2,
      name: r'employeeId',
      type: IsarType.string,
    ),
    r'lateMinutes': PropertySchema(
      id: 3,
      name: r'lateMinutes',
      type: IsarType.long,
    ),
    r'organizationId': PropertySchema(
      id: 4,
      name: r'organizationId',
      type: IsarType.string,
    ),
    r'overtimeMinutes': PropertySchema(
      id: 5,
      name: r'overtimeMinutes',
      type: IsarType.long,
    ),
    r'punchIn': PropertySchema(
      id: 6,
      name: r'punchIn',
      type: IsarType.dateTime,
    ),
    r'punchOut': PropertySchema(
      id: 7,
      name: r'punchOut',
      type: IsarType.dateTime,
    ),
    r'recordId': PropertySchema(
      id: 8,
      name: r'recordId',
      type: IsarType.string,
    ),
    r'status': PropertySchema(
      id: 9,
      name: r'status',
      type: IsarType.string,
    ),
    r'workingMinutes': PropertySchema(
      id: 10,
      name: r'workingMinutes',
      type: IsarType.long,
    )
  },
  estimateSize: _cachedAttendanceRecordEstimateSize,
  serialize: _cachedAttendanceRecordSerialize,
  deserialize: _cachedAttendanceRecordDeserialize,
  deserializeProp: _cachedAttendanceRecordDeserializeProp,
  idName: r'id',
  indexes: {
    r'recordId': IndexSchema(
      id: 907839981883940929,
      name: r'recordId',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'recordId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _cachedAttendanceRecordGetId,
  getLinks: _cachedAttendanceRecordGetLinks,
  attach: _cachedAttendanceRecordAttach,
  version: '3.1.0+1',
);

int _cachedAttendanceRecordEstimateSize(
  CachedAttendanceRecord object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.employeeId.length * 3;
  bytesCount += 3 + object.organizationId.length * 3;
  bytesCount += 3 + object.recordId.length * 3;
  bytesCount += 3 + object.status.length * 3;
  return bytesCount;
}

void _cachedAttendanceRecordSerialize(
  CachedAttendanceRecord object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.cachedAt);
  writer.writeDateTime(offsets[1], object.date);
  writer.writeString(offsets[2], object.employeeId);
  writer.writeLong(offsets[3], object.lateMinutes);
  writer.writeString(offsets[4], object.organizationId);
  writer.writeLong(offsets[5], object.overtimeMinutes);
  writer.writeDateTime(offsets[6], object.punchIn);
  writer.writeDateTime(offsets[7], object.punchOut);
  writer.writeString(offsets[8], object.recordId);
  writer.writeString(offsets[9], object.status);
  writer.writeLong(offsets[10], object.workingMinutes);
}

CachedAttendanceRecord _cachedAttendanceRecordDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = CachedAttendanceRecord();
  object.cachedAt = reader.readDateTime(offsets[0]);
  object.date = reader.readDateTime(offsets[1]);
  object.employeeId = reader.readString(offsets[2]);
  object.id = id;
  object.lateMinutes = reader.readLongOrNull(offsets[3]);
  object.organizationId = reader.readString(offsets[4]);
  object.overtimeMinutes = reader.readLongOrNull(offsets[5]);
  object.punchIn = reader.readDateTimeOrNull(offsets[6]);
  object.punchOut = reader.readDateTimeOrNull(offsets[7]);
  object.recordId = reader.readString(offsets[8]);
  object.status = reader.readString(offsets[9]);
  object.workingMinutes = reader.readLongOrNull(offsets[10]);
  return object;
}

P _cachedAttendanceRecordDeserializeProp<P>(
  IsarReader reader,
  int propertyId,
  int offset,
  Map<Type, List<int>> allOffsets,
) {
  switch (propertyId) {
    case 0:
      return (reader.readDateTime(offset)) as P;
    case 1:
      return (reader.readDateTime(offset)) as P;
    case 2:
      return (reader.readString(offset)) as P;
    case 3:
      return (reader.readLongOrNull(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readLongOrNull(offset)) as P;
    case 6:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 7:
      return (reader.readDateTimeOrNull(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readString(offset)) as P;
    case 10:
      return (reader.readLongOrNull(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _cachedAttendanceRecordGetId(CachedAttendanceRecord object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _cachedAttendanceRecordGetLinks(
    CachedAttendanceRecord object) {
  return [];
}

void _cachedAttendanceRecordAttach(
    IsarCollection<dynamic> col, Id id, CachedAttendanceRecord object) {
  object.id = id;
}

extension CachedAttendanceRecordByIndex
    on IsarCollection<CachedAttendanceRecord> {
  Future<CachedAttendanceRecord?> getByRecordId(String recordId) {
    return getByIndex(r'recordId', [recordId]);
  }

  CachedAttendanceRecord? getByRecordIdSync(String recordId) {
    return getByIndexSync(r'recordId', [recordId]);
  }

  Future<bool> deleteByRecordId(String recordId) {
    return deleteByIndex(r'recordId', [recordId]);
  }

  bool deleteByRecordIdSync(String recordId) {
    return deleteByIndexSync(r'recordId', [recordId]);
  }

  Future<List<CachedAttendanceRecord?>> getAllByRecordId(
      List<String> recordIdValues) {
    final values = recordIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'recordId', values);
  }

  List<CachedAttendanceRecord?> getAllByRecordIdSync(
      List<String> recordIdValues) {
    final values = recordIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'recordId', values);
  }

  Future<int> deleteAllByRecordId(List<String> recordIdValues) {
    final values = recordIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'recordId', values);
  }

  int deleteAllByRecordIdSync(List<String> recordIdValues) {
    final values = recordIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'recordId', values);
  }

  Future<Id> putByRecordId(CachedAttendanceRecord object) {
    return putByIndex(r'recordId', object);
  }

  Id putByRecordIdSync(CachedAttendanceRecord object, {bool saveLinks = true}) {
    return putByIndexSync(r'recordId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByRecordId(List<CachedAttendanceRecord> objects) {
    return putAllByIndex(r'recordId', objects);
  }

  List<Id> putAllByRecordIdSync(List<CachedAttendanceRecord> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'recordId', objects, saveLinks: saveLinks);
  }
}

extension CachedAttendanceRecordQueryWhereSort
    on QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QWhere> {
  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterWhere>
      anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension CachedAttendanceRecordQueryWhere on QueryBuilder<
    CachedAttendanceRecord, CachedAttendanceRecord, QWhereClause> {
  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> idNotEqualTo(Id id) {
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> idBetween(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> recordIdEqualTo(String recordId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'recordId',
        value: [recordId],
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterWhereClause> recordIdNotEqualTo(String recordId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'recordId',
              lower: [],
              upper: [recordId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'recordId',
              lower: [recordId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'recordId',
              lower: [recordId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'recordId',
              lower: [],
              upper: [recordId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension CachedAttendanceRecordQueryFilter on QueryBuilder<
    CachedAttendanceRecord, CachedAttendanceRecord, QFilterCondition> {
  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> cachedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> cachedAtGreaterThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> cachedAtLessThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> cachedAtBetween(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> dateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'date',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> dateGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'date',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> dateLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'date',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> dateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'date',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdEqualTo(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdGreaterThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdLessThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdBetween(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdStartsWith(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdEndsWith(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      employeeIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      employeeIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'employeeId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'employeeId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> employeeIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'employeeId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> idGreaterThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> idLessThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> idBetween(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> lateMinutesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'lateMinutes',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> lateMinutesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'lateMinutes',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> lateMinutesEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'lateMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> lateMinutesGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'lateMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> lateMinutesLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'lateMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> lateMinutesBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'lateMinutes',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdEqualTo(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdGreaterThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdLessThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdBetween(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdStartsWith(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdEndsWith(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      organizationIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      organizationIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'organizationId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'organizationId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> organizationIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'organizationId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> overtimeMinutesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'overtimeMinutes',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> overtimeMinutesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'overtimeMinutes',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> overtimeMinutesEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'overtimeMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> overtimeMinutesGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'overtimeMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> overtimeMinutesLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'overtimeMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> overtimeMinutesBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'overtimeMinutes',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchInIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'punchIn',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchInIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'punchIn',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchInEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'punchIn',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchInGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'punchIn',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchInLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'punchIn',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchInBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'punchIn',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchOutIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'punchOut',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchOutIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'punchOut',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchOutEqualTo(DateTime? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'punchOut',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchOutGreaterThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'punchOut',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchOutLessThan(
    DateTime? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'punchOut',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> punchOutBetween(
    DateTime? lower,
    DateTime? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'punchOut',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'recordId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'recordId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'recordId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'recordId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'recordId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'recordId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      recordIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'recordId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      recordIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'recordId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'recordId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> recordIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'recordId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusEqualTo(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusGreaterThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusLessThan(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusBetween(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusStartsWith(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusEndsWith(
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

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      statusContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
          QAfterFilterCondition>
      statusMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'status',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> workingMinutesIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'workingMinutes',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> workingMinutesIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'workingMinutes',
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> workingMinutesEqualTo(int? value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'workingMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> workingMinutesGreaterThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'workingMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> workingMinutesLessThan(
    int? value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'workingMinutes',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord,
      QAfterFilterCondition> workingMinutesBetween(
    int? lower,
    int? upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'workingMinutes',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }
}

extension CachedAttendanceRecordQueryObject on QueryBuilder<
    CachedAttendanceRecord, CachedAttendanceRecord, QFilterCondition> {}

extension CachedAttendanceRecordQueryLinks on QueryBuilder<
    CachedAttendanceRecord, CachedAttendanceRecord, QFilterCondition> {}

extension CachedAttendanceRecordQuerySortBy
    on QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QSortBy> {
  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByEmployeeId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByEmployeeIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByLateMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lateMinutes', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByLateMinutesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lateMinutes', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByOrganizationId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByOrganizationIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByOvertimeMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'overtimeMinutes', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByOvertimeMinutesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'overtimeMinutes', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByPunchIn() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchIn', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByPunchInDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchIn', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByPunchOut() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchOut', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByPunchOutDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchOut', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByRecordId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'recordId', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByRecordIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'recordId', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByWorkingMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'workingMinutes', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      sortByWorkingMinutesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'workingMinutes', Sort.desc);
    });
  }
}

extension CachedAttendanceRecordQuerySortThenBy on QueryBuilder<
    CachedAttendanceRecord, CachedAttendanceRecord, QSortThenBy> {
  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'date', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByEmployeeId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByEmployeeIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByLateMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lateMinutes', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByLateMinutesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'lateMinutes', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByOrganizationId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByOrganizationIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByOvertimeMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'overtimeMinutes', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByOvertimeMinutesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'overtimeMinutes', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByPunchIn() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchIn', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByPunchInDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchIn', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByPunchOut() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchOut', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByPunchOutDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'punchOut', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByRecordId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'recordId', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByRecordIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'recordId', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByWorkingMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'workingMinutes', Sort.asc);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QAfterSortBy>
      thenByWorkingMinutesDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'workingMinutes', Sort.desc);
    });
  }
}

extension CachedAttendanceRecordQueryWhereDistinct
    on QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct> {
  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'cachedAt');
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'date');
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByEmployeeId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'employeeId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByLateMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'lateMinutes');
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByOrganizationId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'organizationId',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByOvertimeMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'overtimeMinutes');
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByPunchIn() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'punchIn');
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByPunchOut() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'punchOut');
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByRecordId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'recordId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByStatus({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedAttendanceRecord, CachedAttendanceRecord, QDistinct>
      distinctByWorkingMinutes() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'workingMinutes');
    });
  }
}

extension CachedAttendanceRecordQueryProperty on QueryBuilder<
    CachedAttendanceRecord, CachedAttendanceRecord, QQueryProperty> {
  QueryBuilder<CachedAttendanceRecord, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<CachedAttendanceRecord, DateTime, QQueryOperations>
      cachedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'cachedAt');
    });
  }

  QueryBuilder<CachedAttendanceRecord, DateTime, QQueryOperations>
      dateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'date');
    });
  }

  QueryBuilder<CachedAttendanceRecord, String, QQueryOperations>
      employeeIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'employeeId');
    });
  }

  QueryBuilder<CachedAttendanceRecord, int?, QQueryOperations>
      lateMinutesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'lateMinutes');
    });
  }

  QueryBuilder<CachedAttendanceRecord, String, QQueryOperations>
      organizationIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizationId');
    });
  }

  QueryBuilder<CachedAttendanceRecord, int?, QQueryOperations>
      overtimeMinutesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'overtimeMinutes');
    });
  }

  QueryBuilder<CachedAttendanceRecord, DateTime?, QQueryOperations>
      punchInProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'punchIn');
    });
  }

  QueryBuilder<CachedAttendanceRecord, DateTime?, QQueryOperations>
      punchOutProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'punchOut');
    });
  }

  QueryBuilder<CachedAttendanceRecord, String, QQueryOperations>
      recordIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'recordId');
    });
  }

  QueryBuilder<CachedAttendanceRecord, String, QQueryOperations>
      statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<CachedAttendanceRecord, int?, QQueryOperations>
      workingMinutesProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'workingMinutes');
    });
  }
}
