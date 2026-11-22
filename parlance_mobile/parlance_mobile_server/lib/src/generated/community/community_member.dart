/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters
// ignore_for_file: invalid_use_of_internal_member

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'dart:async' as _ida;
import 'package:parlance_mobile_server/src/generated/protocol.dart'
    as _ireuocbz;
import 'package:serverpod/serverpod.dart' as _is;

/// Someone who joined the Community with a name of their choice.
abstract class CommunityMember
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  CommunityMember._({
    this.id,
    this.userId,
    required this.handle,
    this.handleKey,
    required this.city,
    required this.ways,
    bool? sample,
    DateTime? joinedAt,
  }) : sample = sample ?? false,
       joinedAt = joinedAt ?? DateTime.now();

  factory CommunityMember({
    int? id,
    String? userId,
    required String handle,
    String? handleKey,
    required String city,
    required List<String> ways,
    bool? sample,
    DateTime? joinedAt,
  }) = _CommunityMemberImpl;

  factory CommunityMember.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityMember(
      id: jsonSerialization['id'] as int?,
      userId: jsonSerialization['userId'] as String?,
      handle: jsonSerialization['handle'] as String,
      handleKey: jsonSerialization['handleKey'] as String?,
      city: jsonSerialization['city'] as String,
      ways: _ireuocbz.Protocol().deserialize<List<String>>(
        jsonSerialization['ways'],
      ),
      sample: jsonSerialization['sample'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['sample']),
      joinedAt: jsonSerialization['joinedAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['joinedAt']),
    );
  }

  static final t = CommunityMemberTable();

  static const db = CommunityMemberRepository._();

  @override
  int? id;

  /// The signed-in account. Never sent to phones.
  String? userId;

  /// The name people see. Not a real name unless they want it to be.
  String handle;

  /// The name in lower case, so "Asha" and "asha" cannot both exist.
  String? handleKey;

  String city;

  /// How they describe themselves: deaf, hard-of-hearing, deafblind, family, learning, interpreter, teacher.
  List<String> ways;

  /// Written by Parlance as an example, not by a real person.
  bool sample;

  DateTime joinedAt;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [CommunityMember]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityMember copyWith({
    int? id,
    String? userId,
    String? handle,
    String? handleKey,
    String? city,
    List<String>? ways,
    bool? sample,
    DateTime? joinedAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityMember',
      if (id != null) 'id': id,
      if (userId != null) 'userId': userId,
      'handle': handle,
      if (handleKey != null) 'handleKey': handleKey,
      'city': city,
      'ways': ways.toJson(),
      'sample': sample,
      'joinedAt': joinedAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityMember',
      if (id != null) 'id': id,
      'handle': handle,
      'city': city,
      'ways': ways.toJson(),
      'sample': sample,
      'joinedAt': joinedAt.toJson(),
    };
  }

  static CommunityMemberInclude include() {
    return CommunityMemberInclude._();
  }

  static CommunityMemberIncludeList includeList({
    _is.WhereExpressionBuilder<CommunityMemberTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    CommunityMemberInclude? include,
  }) {
    return CommunityMemberIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityMemberImpl extends CommunityMember {
  _CommunityMemberImpl({
    int? id,
    String? userId,
    required String handle,
    String? handleKey,
    required String city,
    required List<String> ways,
    bool? sample,
    DateTime? joinedAt,
  }) : super._(
         id: id,
         userId: userId,
         handle: handle,
         handleKey: handleKey,
         city: city,
         ways: ways,
         sample: sample,
         joinedAt: joinedAt,
       );

  /// Returns a shallow copy of this [CommunityMember]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityMember copyWith({
    Object? id = _Undefined,
    Object? userId = _Undefined,
    String? handle,
    Object? handleKey = _Undefined,
    String? city,
    List<String>? ways,
    bool? sample,
    DateTime? joinedAt,
  }) {
    return CommunityMember(
      id: id is int? ? id : this.id,
      userId: userId is String? ? userId : this.userId,
      handle: handle ?? this.handle,
      handleKey: handleKey is String? ? handleKey : this.handleKey,
      city: city ?? this.city,
      ways: ways ?? this.ways.map((e0) => e0).toList(),
      sample: sample ?? this.sample,
      joinedAt: joinedAt ?? this.joinedAt,
    );
  }
}

class CommunityMemberUpdateTable extends _is.UpdateTable<CommunityMemberTable> {
  CommunityMemberUpdateTable(super.table);

  _is.ColumnValue<String, String> userId(String? value) => _is.ColumnValue(
    table.userId,
    value,
  );

  _is.ColumnValue<String, String> handle(String value) => _is.ColumnValue(
    table.handle,
    value,
  );

  _is.ColumnValue<String, String> handleKey(String? value) => _is.ColumnValue(
    table.handleKey,
    value,
  );

  _is.ColumnValue<String, String> city(String value) => _is.ColumnValue(
    table.city,
    value,
  );

  _is.ColumnValue<List<String>, List<String>> ways(List<String> value) =>
      _is.ColumnValue(
        table.ways,
        value,
      );

  _is.ColumnValue<bool, bool> sample(bool value) => _is.ColumnValue(
    table.sample,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> joinedAt(DateTime value) =>
      _is.ColumnValue(
        table.joinedAt,
        value,
      );
}

class CommunityMemberTable extends _is.Table<int?> {
  CommunityMemberTable({super.tableRelation})
    : super(tableName: 'community_member') {
    updateTable = CommunityMemberUpdateTable(this);
    userId = _is.ColumnString(
      'userId',
      this,
    );
    handle = _is.ColumnString(
      'handle',
      this,
    );
    handleKey = _is.ColumnString(
      'handleKey',
      this,
    );
    city = _is.ColumnString(
      'city',
      this,
    );
    ways = _is.ColumnSerializable<List<String>>(
      'ways',
      this,
    );
    sample = _is.ColumnBool(
      'sample',
      this,
      hasDefault: true,
    );
    joinedAt = _is.ColumnDateTime(
      'joinedAt',
      this,
      hasDefault: true,
    );
  }

  late final CommunityMemberUpdateTable updateTable;

  /// The signed-in account. Never sent to phones.
  late final _is.ColumnString userId;

  /// The name people see. Not a real name unless they want it to be.
  late final _is.ColumnString handle;

  /// The name in lower case, so "Asha" and "asha" cannot both exist.
  late final _is.ColumnString handleKey;

  late final _is.ColumnString city;

  /// How they describe themselves: deaf, hard-of-hearing, deafblind, family, learning, interpreter, teacher.
  late final _is.ColumnSerializable<List<String>> ways;

  /// Written by Parlance as an example, not by a real person.
  late final _is.ColumnBool sample;

  late final _is.ColumnDateTime joinedAt;

  @override
  List<_is.Column> get columns => [
    id,
    userId,
    handle,
    handleKey,
    city,
    ways,
    sample,
    joinedAt,
  ];
}

class CommunityMemberInclude extends _is.IncludeObject {
  CommunityMemberInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => CommunityMember.t;
}

class CommunityMemberIncludeList extends _is.IncludeList {
  CommunityMemberIncludeList._({
    _is.WhereExpressionBuilder<CommunityMemberTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(CommunityMember.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => CommunityMember.t;
}

class CommunityMemberRepository {
  const CommunityMemberRepository._();

  /// Returns a list of [CommunityMember]s matching the given query parameters.
  ///
  /// Use [where] to specify which items to include in the return value.
  /// If none is specified, all items will be returned.
  ///
  /// To specify the order of the items use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// The maximum number of items can be set by [limit]. If no limit is set,
  /// all items matching the query will be returned.
  ///
  /// [offset] defines how many items to skip, after which [limit] (or all)
  /// items are read from the database.
  ///
  /// ```dart
  /// var persons = await Persons.db.find(
  ///   session,
  ///   where: (t) => t.lastName.equals('Jones'),
  ///   orderBy: (t) => t.firstName,
  ///   limit: 100,
  /// );
  /// ```
  Future<List<CommunityMember>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMemberTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<CommunityMember>(
      where: where?.call(CommunityMember.t),
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [CommunityMember]s matching the given query parameters every time the
  /// source tables are modified.
  ///
  /// Use [where] to specify which items to include in the return value.
  /// If none is specified, all items will be returned.
  ///
  /// To specify the order of the items use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// The maximum number of items can be set by [limit]. If no limit is set,
  /// all items matching the query will be returned.
  ///
  /// [offset] defines how many items to skip, after which [limit] (or all)
  /// items are read from the database.
  ///
  /// Use [throttle] to specify the minimum interval between queries. It can
  /// also be set to `null`, in which case the stream will only be throttled
  /// when its subscription is paused.
  ///
  /// Source tables are collected from the queried table, [where], [orderBy],
  /// [orderByList], and the [include] graph. [alsoTriggerOnTables] is added
  /// to that set. Pass [Table] instances such as `CommunityMember.t`.
  ///
  /// Raw [Expression] SQL is not inspected. Tables referenced only in raw
  /// SQL must be passed via [alsoTriggerOnTables].
  ///
  /// The stream always reads committed state and never joins an ambient
  /// [Transaction]. Emissions for a write fire after that write commits.
  ///
  /// Currently only supported on SQLite. Calling this method on PostgreSQL
  /// throws an [UnsupportedError].
  ///
  /// ```dart
  /// var subscription = Persons.db.watch(
  ///   session,
  ///   where: (t) => t.lastName.equals('Jones'),
  ///   orderBy: (t) => t.firstName,
  ///   limit: 100,
  /// ).listen((persons) {
  ///   // Handle the latest matching rows.
  /// });
  /// ```
  _ida.Stream<List<CommunityMember>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMemberTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<CommunityMember>(
      where: where?.call(CommunityMember.t),
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [CommunityMember] matching the given query parameters.
  ///
  /// Use [where] to specify which items to include in the return value.
  /// If none is specified, all items will be returned.
  ///
  /// To specify the order use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// [offset] defines how many items to skip, after which the next one will be picked.
  ///
  /// ```dart
  /// var youngestPerson = await Persons.db.findFirstRow(
  ///   session,
  ///   where: (t) => t.lastName.equals('Jones'),
  ///   orderBy: (t) => t.age,
  /// );
  /// ```
  Future<CommunityMember?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMemberTable>? where,
    int? offset,
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<CommunityMember>(
      where: where?.call(CommunityMember.t),
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [CommunityMember] by its [id] or null if no such row exists.
  Future<CommunityMember?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<CommunityMember>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [CommunityMember]s in the list and returns the inserted rows.
  ///
  /// The returned [CommunityMember]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// insert, none of the rows will be inserted.
  ///
  /// If [ignoreConflicts] is set to `true`, rows that conflict with existing
  /// rows are silently skipped, and only the successfully inserted rows are
  /// returned.
  ///
  /// If [noReturn] is set to `true`, the inserted rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMember>> insert(
    _is.DatabaseSession session,
    List<CommunityMember> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<CommunityMember>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [CommunityMember] and returns the inserted row.
  ///
  /// The returned [CommunityMember] will have its `id` field set.
  Future<CommunityMember> insertRow(
    _is.DatabaseSession session,
    CommunityMember row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<CommunityMember>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [CommunityMember]s in the list and returns the resulting rows.
  ///
  /// If a row conflicts on the given [conflictColumns], the existing row is
  /// updated with the new values. Otherwise, a new row is inserted.
  ///
  /// If [updateColumns] is provided, only those columns will be updated on
  /// conflict. If null, all non-conflict, non-id columns are updated.
  ///
  /// If [updateWhere] is provided, the update only applies to rows matching the
  /// given expression. Conflicting rows that don't match are skipped and not
  /// returned, so the resulting list may be shorter than [rows].
  ///
  /// The returned [CommunityMember]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMember>> upsert(
    _is.DatabaseSession session,
    List<CommunityMember> rows, {
    required _is.ColumnSelections<CommunityMemberTable> conflictColumns,
    _is.ColumnSelections<CommunityMemberTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityMemberTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<CommunityMember>(
      rows,
      conflictColumns: conflictColumns(CommunityMember.t),
      updateColumns: updateColumns?.call(CommunityMember.t),
      updateWhere: updateWhere?.call(CommunityMember.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [CommunityMember] and returns the resulting row.
  ///
  /// If the row conflicts on the given [conflictColumns], the existing row is
  /// updated. Otherwise, a new row is inserted.
  ///
  /// If [updateColumns] is provided, only those columns will be updated on
  /// conflict. If null, all non-conflict, non-id columns are updated.
  ///
  /// If [updateWhere] is provided, the update only applies when the existing
  /// row matches the expression. Returns `null` if no row was affected — for
  /// example when [updateWhere] does not match the conflicting row.
  ///
  /// The returned [CommunityMember] will have its `id` field set.
  Future<CommunityMember?> upsertRow(
    _is.DatabaseSession session,
    CommunityMember row, {
    required _is.ColumnSelections<CommunityMemberTable> conflictColumns,
    _is.ColumnSelections<CommunityMemberTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityMemberTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<CommunityMember>(
      row,
      conflictColumns: conflictColumns(CommunityMember.t),
      updateColumns: updateColumns?.call(CommunityMember.t),
      updateWhere: updateWhere?.call(CommunityMember.t),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityMember]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMember>> update(
    _is.DatabaseSession session,
    List<CommunityMember> rows, {
    _is.ColumnSelections<CommunityMemberTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<CommunityMember>(
      rows,
      columns: columns?.call(CommunityMember.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [CommunityMember]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<CommunityMember> updateRow(
    _is.DatabaseSession session,
    CommunityMember row, {
    _is.ColumnSelections<CommunityMemberTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<CommunityMember>(
      row,
      columns: columns?.call(CommunityMember.t),
      transaction: transaction,
    );
  }

  /// Updates a single [CommunityMember] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<CommunityMember?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<CommunityMemberUpdateTable>
    columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<CommunityMember>(
      id,
      columnValues: columnValues(CommunityMember.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityMember]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMember>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<CommunityMemberUpdateTable>
    columnValues,
    required _is.WhereExpressionBuilder<CommunityMemberTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<CommunityMember>(
      columnValues: columnValues(CommunityMember.t.updateTable),
      where: where(CommunityMember.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [CommunityMember]s in the list and returns the deleted rows.
  ///
  /// To specify the order of the returned rows use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// This is an atomic operation, meaning that if one of the rows fail to
  /// be deleted, none of the rows will be deleted.
  ///
  /// If [noReturn] is set to `true`, the deleted rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMember>> delete(
    _is.DatabaseSession session,
    List<CommunityMember> rows, {
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<CommunityMember>(
      rows,
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [CommunityMember].
  Future<CommunityMember> deleteRow(
    _is.DatabaseSession session,
    CommunityMember row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<CommunityMember>(
      row,
      transaction: transaction,
    );
  }

  /// Deletes all rows matching the [where] expression.
  ///
  /// To specify the order of the returned rows use [orderBy] or [orderByList]
  /// when sorting by multiple columns.
  ///
  /// If [noReturn] is set to `true`, the deleted rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMember>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityMemberTable> where,
    _is.OrderByBuilder<CommunityMemberTable>? orderBy,
    _is.OrderByListBuilder<CommunityMemberTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<CommunityMember>(
      where: where(CommunityMember.t),
      orderBy: orderBy?.call(CommunityMember.t),
      orderByList: orderByList?.call(CommunityMember.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMemberTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<CommunityMember>(
      where: where?.call(CommunityMember.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [CommunityMember] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityMemberTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<CommunityMember>(
      where: where(CommunityMember.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
