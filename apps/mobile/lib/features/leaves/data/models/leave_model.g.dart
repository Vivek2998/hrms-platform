// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'leave_model.dart';

// **************************************************************************
// IsarCollectionGenerator
// **************************************************************************

// coverage:ignore-file
// ignore_for_file: duplicate_ignore, non_constant_identifier_names, constant_identifier_names, invalid_use_of_protected_member, unnecessary_cast, prefer_const_constructors, lines_longer_than_80_chars, require_trailing_commas, inference_failure_on_function_invocation, unnecessary_parenthesis, unnecessary_raw_strings, unnecessary_null_checks, join_return_with_assignment, prefer_final_locals, avoid_js_rounded_ints, avoid_positional_boolean_parameters, always_specify_types

extension GetCachedLeaveRequestCollection on Isar {
  IsarCollection<CachedLeaveRequest> get cachedLeaveRequests =>
      this.collection();
}

const CachedLeaveRequestSchema = CollectionSchema(
  name: r'CachedLeaveRequest',
  id: -5773102625495928836,
  properties: {
    r'appliedAt': PropertySchema(
      id: 0,
      name: r'appliedAt',
      type: IsarType.dateTime,
    ),
    r'cachedAt': PropertySchema(
      id: 1,
      name: r'cachedAt',
      type: IsarType.dateTime,
    ),
    r'employeeId': PropertySchema(
      id: 2,
      name: r'employeeId',
      type: IsarType.string,
    ),
    r'endDate': PropertySchema(
      id: 3,
      name: r'endDate',
      type: IsarType.dateTime,
    ),
    r'leaveId': PropertySchema(
      id: 4,
      name: r'leaveId',
      type: IsarType.string,
    ),
    r'leaveTypeCode': PropertySchema(
      id: 5,
      name: r'leaveTypeCode',
      type: IsarType.string,
    ),
    r'leaveTypeName': PropertySchema(
      id: 6,
      name: r'leaveTypeName',
      type: IsarType.string,
    ),
    r'organizationId': PropertySchema(
      id: 7,
      name: r'organizationId',
      type: IsarType.string,
    ),
    r'reason': PropertySchema(
      id: 8,
      name: r'reason',
      type: IsarType.string,
    ),
    r'remarks': PropertySchema(
      id: 9,
      name: r'remarks',
      type: IsarType.string,
    ),
    r'startDate': PropertySchema(
      id: 10,
      name: r'startDate',
      type: IsarType.dateTime,
    ),
    r'status': PropertySchema(
      id: 11,
      name: r'status',
      type: IsarType.string,
    ),
    r'totalDays': PropertySchema(
      id: 12,
      name: r'totalDays',
      type: IsarType.double,
    )
  },
  estimateSize: _cachedLeaveRequestEstimateSize,
  serialize: _cachedLeaveRequestSerialize,
  deserialize: _cachedLeaveRequestDeserialize,
  deserializeProp: _cachedLeaveRequestDeserializeProp,
  idName: r'id',
  indexes: {
    r'leaveId': IndexSchema(
      id: -7768339321416045199,
      name: r'leaveId',
      unique: true,
      replace: false,
      properties: [
        IndexPropertySchema(
          name: r'leaveId',
          type: IndexType.hash,
          caseSensitive: true,
        )
      ],
    )
  },
  links: {},
  embeddedSchemas: {},
  getId: _cachedLeaveRequestGetId,
  getLinks: _cachedLeaveRequestGetLinks,
  attach: _cachedLeaveRequestAttach,
  version: '3.1.0+1',
);

int _cachedLeaveRequestEstimateSize(
  CachedLeaveRequest object,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  var bytesCount = offsets.last;
  bytesCount += 3 + object.employeeId.length * 3;
  bytesCount += 3 + object.leaveId.length * 3;
  bytesCount += 3 + object.leaveTypeCode.length * 3;
  bytesCount += 3 + object.leaveTypeName.length * 3;
  bytesCount += 3 + object.organizationId.length * 3;
  bytesCount += 3 + object.reason.length * 3;
  {
    final value = object.remarks;
    if (value != null) {
      bytesCount += 3 + value.length * 3;
    }
  }
  bytesCount += 3 + object.status.length * 3;
  return bytesCount;
}

void _cachedLeaveRequestSerialize(
  CachedLeaveRequest object,
  IsarWriter writer,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  writer.writeDateTime(offsets[0], object.appliedAt);
  writer.writeDateTime(offsets[1], object.cachedAt);
  writer.writeString(offsets[2], object.employeeId);
  writer.writeDateTime(offsets[3], object.endDate);
  writer.writeString(offsets[4], object.leaveId);
  writer.writeString(offsets[5], object.leaveTypeCode);
  writer.writeString(offsets[6], object.leaveTypeName);
  writer.writeString(offsets[7], object.organizationId);
  writer.writeString(offsets[8], object.reason);
  writer.writeString(offsets[9], object.remarks);
  writer.writeDateTime(offsets[10], object.startDate);
  writer.writeString(offsets[11], object.status);
  writer.writeDouble(offsets[12], object.totalDays);
}

CachedLeaveRequest _cachedLeaveRequestDeserialize(
  Id id,
  IsarReader reader,
  List<int> offsets,
  Map<Type, List<int>> allOffsets,
) {
  final object = CachedLeaveRequest();
  object.appliedAt = reader.readDateTime(offsets[0]);
  object.cachedAt = reader.readDateTime(offsets[1]);
  object.employeeId = reader.readString(offsets[2]);
  object.endDate = reader.readDateTime(offsets[3]);
  object.id = id;
  object.leaveId = reader.readString(offsets[4]);
  object.leaveTypeCode = reader.readString(offsets[5]);
  object.leaveTypeName = reader.readString(offsets[6]);
  object.organizationId = reader.readString(offsets[7]);
  object.reason = reader.readString(offsets[8]);
  object.remarks = reader.readStringOrNull(offsets[9]);
  object.startDate = reader.readDateTime(offsets[10]);
  object.status = reader.readString(offsets[11]);
  object.totalDays = reader.readDouble(offsets[12]);
  return object;
}

P _cachedLeaveRequestDeserializeProp<P>(
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
      return (reader.readDateTime(offset)) as P;
    case 4:
      return (reader.readString(offset)) as P;
    case 5:
      return (reader.readString(offset)) as P;
    case 6:
      return (reader.readString(offset)) as P;
    case 7:
      return (reader.readString(offset)) as P;
    case 8:
      return (reader.readString(offset)) as P;
    case 9:
      return (reader.readStringOrNull(offset)) as P;
    case 10:
      return (reader.readDateTime(offset)) as P;
    case 11:
      return (reader.readString(offset)) as P;
    case 12:
      return (reader.readDouble(offset)) as P;
    default:
      throw IsarError('Unknown property with id $propertyId');
  }
}

Id _cachedLeaveRequestGetId(CachedLeaveRequest object) {
  return object.id;
}

List<IsarLinkBase<dynamic>> _cachedLeaveRequestGetLinks(
    CachedLeaveRequest object) {
  return [];
}

void _cachedLeaveRequestAttach(
    IsarCollection<dynamic> col, Id id, CachedLeaveRequest object) {
  object.id = id;
}

extension CachedLeaveRequestByIndex on IsarCollection<CachedLeaveRequest> {
  Future<CachedLeaveRequest?> getByLeaveId(String leaveId) {
    return getByIndex(r'leaveId', [leaveId]);
  }

  CachedLeaveRequest? getByLeaveIdSync(String leaveId) {
    return getByIndexSync(r'leaveId', [leaveId]);
  }

  Future<bool> deleteByLeaveId(String leaveId) {
    return deleteByIndex(r'leaveId', [leaveId]);
  }

  bool deleteByLeaveIdSync(String leaveId) {
    return deleteByIndexSync(r'leaveId', [leaveId]);
  }

  Future<List<CachedLeaveRequest?>> getAllByLeaveId(
      List<String> leaveIdValues) {
    final values = leaveIdValues.map((e) => [e]).toList();
    return getAllByIndex(r'leaveId', values);
  }

  List<CachedLeaveRequest?> getAllByLeaveIdSync(List<String> leaveIdValues) {
    final values = leaveIdValues.map((e) => [e]).toList();
    return getAllByIndexSync(r'leaveId', values);
  }

  Future<int> deleteAllByLeaveId(List<String> leaveIdValues) {
    final values = leaveIdValues.map((e) => [e]).toList();
    return deleteAllByIndex(r'leaveId', values);
  }

  int deleteAllByLeaveIdSync(List<String> leaveIdValues) {
    final values = leaveIdValues.map((e) => [e]).toList();
    return deleteAllByIndexSync(r'leaveId', values);
  }

  Future<Id> putByLeaveId(CachedLeaveRequest object) {
    return putByIndex(r'leaveId', object);
  }

  Id putByLeaveIdSync(CachedLeaveRequest object, {bool saveLinks = true}) {
    return putByIndexSync(r'leaveId', object, saveLinks: saveLinks);
  }

  Future<List<Id>> putAllByLeaveId(List<CachedLeaveRequest> objects) {
    return putAllByIndex(r'leaveId', objects);
  }

  List<Id> putAllByLeaveIdSync(List<CachedLeaveRequest> objects,
      {bool saveLinks = true}) {
    return putAllByIndexSync(r'leaveId', objects, saveLinks: saveLinks);
  }
}

extension CachedLeaveRequestQueryWhereSort
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QWhere> {
  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhere> anyId() {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(const IdWhereClause.any());
    });
  }
}

extension CachedLeaveRequestQueryWhere
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QWhereClause> {
  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      idEqualTo(Id id) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IdWhereClause.between(
        lower: id,
        upper: id,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      idNotEqualTo(Id id) {
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      idGreaterThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.greaterThan(lower: id, includeLower: include),
      );
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      idLessThan(Id id, {bool include = false}) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(
        IdWhereClause.lessThan(upper: id, includeUpper: include),
      );
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      idBetween(
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      leaveIdEqualTo(String leaveId) {
    return QueryBuilder.apply(this, (query) {
      return query.addWhereClause(IndexWhereClause.equalTo(
        indexName: r'leaveId',
        value: [leaveId],
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterWhereClause>
      leaveIdNotEqualTo(String leaveId) {
    return QueryBuilder.apply(this, (query) {
      if (query.whereSort == Sort.asc) {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'leaveId',
              lower: [],
              upper: [leaveId],
              includeUpper: false,
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'leaveId',
              lower: [leaveId],
              includeLower: false,
              upper: [],
            ));
      } else {
        return query
            .addWhereClause(IndexWhereClause.between(
              indexName: r'leaveId',
              lower: [leaveId],
              includeLower: false,
              upper: [],
            ))
            .addWhereClause(IndexWhereClause.between(
              indexName: r'leaveId',
              lower: [],
              upper: [leaveId],
              includeUpper: false,
            ));
      }
    });
  }
}

extension CachedLeaveRequestQueryFilter
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QFilterCondition> {
  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      appliedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'appliedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      appliedAtGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'appliedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      appliedAtLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'appliedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      appliedAtBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'appliedAt',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      cachedAtEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'cachedAt',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      employeeIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'employeeId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      employeeIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'employeeId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      employeeIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'employeeId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      employeeIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'employeeId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      endDateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'endDate',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      endDateGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'endDate',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      endDateLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'endDate',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      endDateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'endDate',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      idEqualTo(Id value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'id',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      idLessThan(
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      idBetween(
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'leaveId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'leaveId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'leaveId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'leaveId',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'leaveId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'leaveId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'leaveId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'leaveId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'leaveId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'leaveId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'leaveTypeCode',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'leaveTypeCode',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'leaveTypeCode',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'leaveTypeCode',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'leaveTypeCode',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'leaveTypeCode',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'leaveTypeCode',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'leaveTypeCode',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'leaveTypeCode',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeCodeIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'leaveTypeCode',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'leaveTypeName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'leaveTypeName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'leaveTypeName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'leaveTypeName',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'leaveTypeName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'leaveTypeName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'leaveTypeName',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'leaveTypeName',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'leaveTypeName',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      leaveTypeNameIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'leaveTypeName',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      organizationIdContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'organizationId',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      organizationIdMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'organizationId',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      organizationIdIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'organizationId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      organizationIdIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'organizationId',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonEqualTo(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'reason',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonGreaterThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'reason',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonLessThan(
    String value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'reason',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonBetween(
    String lower,
    String upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'reason',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'reason',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'reason',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'reason',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'reason',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'reason',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      reasonIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'reason',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksIsNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNull(
        property: r'remarks',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksIsNotNull() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(const FilterCondition.isNotNull(
        property: r'remarks',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksEqualTo(
    String? value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'remarks',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksGreaterThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'remarks',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksLessThan(
    String? value, {
    bool include = false,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'remarks',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksBetween(
    String? lower,
    String? upper, {
    bool includeLower = true,
    bool includeUpper = true,
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'remarks',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksStartsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.startsWith(
        property: r'remarks',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksEndsWith(
    String value, {
    bool caseSensitive = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.endsWith(
        property: r'remarks',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'remarks',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'remarks',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'remarks',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      remarksIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'remarks',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      startDateEqualTo(DateTime value) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'startDate',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      startDateGreaterThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'startDate',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      startDateLessThan(
    DateTime value, {
    bool include = false,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'startDate',
        value: value,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      startDateBetween(
    DateTime lower,
    DateTime upper, {
    bool includeLower = true,
    bool includeUpper = true,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'startDate',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
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

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      statusContains(String value, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.contains(
        property: r'status',
        value: value,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      statusMatches(String pattern, {bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.matches(
        property: r'status',
        wildcard: pattern,
        caseSensitive: caseSensitive,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      statusIsEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      statusIsNotEmpty() {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        property: r'status',
        value: '',
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      totalDaysEqualTo(
    double value, {
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.equalTo(
        property: r'totalDays',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      totalDaysGreaterThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.greaterThan(
        include: include,
        property: r'totalDays',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      totalDaysLessThan(
    double value, {
    bool include = false,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.lessThan(
        include: include,
        property: r'totalDays',
        value: value,
        epsilon: epsilon,
      ));
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterFilterCondition>
      totalDaysBetween(
    double lower,
    double upper, {
    bool includeLower = true,
    bool includeUpper = true,
    double epsilon = Query.epsilon,
  }) {
    return QueryBuilder.apply(this, (query) {
      return query.addFilterCondition(FilterCondition.between(
        property: r'totalDays',
        lower: lower,
        includeLower: includeLower,
        upper: upper,
        includeUpper: includeUpper,
        epsilon: epsilon,
      ));
    });
  }
}

extension CachedLeaveRequestQueryObject
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QFilterCondition> {}

extension CachedLeaveRequestQueryLinks
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QFilterCondition> {}

extension CachedLeaveRequestQuerySortBy
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QSortBy> {
  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByAppliedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'appliedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByAppliedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'appliedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByEmployeeId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByEmployeeIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByEndDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByEndDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByLeaveId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveId', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByLeaveIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveId', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByLeaveTypeCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeCode', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByLeaveTypeCodeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeCode', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByLeaveTypeName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeName', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByLeaveTypeNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeName', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByOrganizationId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByOrganizationIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByReason() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reason', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByReasonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reason', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByRemarks() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remarks', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByRemarksDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remarks', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByStartDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByStartDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByTotalDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDays', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      sortByTotalDaysDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDays', Sort.desc);
    });
  }
}

extension CachedLeaveRequestQuerySortThenBy
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QSortThenBy> {
  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByAppliedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'appliedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByAppliedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'appliedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByCachedAtDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'cachedAt', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByEmployeeId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByEmployeeIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'employeeId', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByEndDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByEndDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'endDate', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenById() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'id', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByLeaveId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveId', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByLeaveIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveId', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByLeaveTypeCode() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeCode', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByLeaveTypeCodeDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeCode', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByLeaveTypeName() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeName', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByLeaveTypeNameDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'leaveTypeName', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByOrganizationId() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByOrganizationIdDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'organizationId', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByReason() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reason', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByReasonDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'reason', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByRemarks() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remarks', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByRemarksDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'remarks', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByStartDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByStartDateDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'startDate', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByStatus() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByStatusDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'status', Sort.desc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByTotalDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDays', Sort.asc);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QAfterSortBy>
      thenByTotalDaysDesc() {
    return QueryBuilder.apply(this, (query) {
      return query.addSortBy(r'totalDays', Sort.desc);
    });
  }
}

extension CachedLeaveRequestQueryWhereDistinct
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct> {
  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByAppliedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'appliedAt');
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByCachedAt() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'cachedAt');
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByEmployeeId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'employeeId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByEndDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'endDate');
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByLeaveId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'leaveId', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByLeaveTypeCode({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'leaveTypeCode',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByLeaveTypeName({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'leaveTypeName',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByOrganizationId({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'organizationId',
          caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByReason({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'reason', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByRemarks({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'remarks', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByStartDate() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'startDate');
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByStatus({bool caseSensitive = true}) {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'status', caseSensitive: caseSensitive);
    });
  }

  QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QDistinct>
      distinctByTotalDays() {
    return QueryBuilder.apply(this, (query) {
      return query.addDistinctBy(r'totalDays');
    });
  }
}

extension CachedLeaveRequestQueryProperty
    on QueryBuilder<CachedLeaveRequest, CachedLeaveRequest, QQueryProperty> {
  QueryBuilder<CachedLeaveRequest, int, QQueryOperations> idProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'id');
    });
  }

  QueryBuilder<CachedLeaveRequest, DateTime, QQueryOperations>
      appliedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'appliedAt');
    });
  }

  QueryBuilder<CachedLeaveRequest, DateTime, QQueryOperations>
      cachedAtProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'cachedAt');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations>
      employeeIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'employeeId');
    });
  }

  QueryBuilder<CachedLeaveRequest, DateTime, QQueryOperations>
      endDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'endDate');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations> leaveIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'leaveId');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations>
      leaveTypeCodeProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'leaveTypeCode');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations>
      leaveTypeNameProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'leaveTypeName');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations>
      organizationIdProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'organizationId');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations> reasonProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'reason');
    });
  }

  QueryBuilder<CachedLeaveRequest, String?, QQueryOperations>
      remarksProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'remarks');
    });
  }

  QueryBuilder<CachedLeaveRequest, DateTime, QQueryOperations>
      startDateProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'startDate');
    });
  }

  QueryBuilder<CachedLeaveRequest, String, QQueryOperations> statusProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'status');
    });
  }

  QueryBuilder<CachedLeaveRequest, double, QQueryOperations>
      totalDaysProperty() {
    return QueryBuilder.apply(this, (query) {
      return query.addPropertyName(r'totalDays');
    });
  }
}
