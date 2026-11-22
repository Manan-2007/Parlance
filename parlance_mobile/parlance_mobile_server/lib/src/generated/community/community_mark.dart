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
import 'package:serverpod/serverpod.dart' as _is;
import '../community/community_mark_kind.dart' as _i92g8nq1;
import '../community/community_target.dart' as _i9cc7j0c;

/// One person's "helpful", report, or "I'm going" on a post or reply.
abstract class CommunityMark
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  CommunityMark._({
    this.id,
    required this.memberId,
    required this.kind,
    required this.target,
    required this.targetId,
    this.reason,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory CommunityMark({
    int? id,
    required int memberId,
    required _i92g8nq1.CommunityMarkKind kind,
    required _i9cc7j0c.CommunityTarget target,
    required int targetId,
    String? reason,
    DateTime? createdAt,
  }) = _CommunityMarkImpl;

  factory CommunityMark.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityMark(
      id: jsonSerialization['id'] as int?,
      memberId: jsonSerialization['memberId'] as int,
      kind: _i92g8nq1.CommunityMarkKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      target: _i9cc7j0c.CommunityTarget.fromJson(
        (jsonSerialization['target'] as String),
      ),
      targetId: jsonSerialization['targetId'] as int,
      reason: jsonSerialization['reason'] as String?,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  static final t = CommunityMarkTable();

  static const db = CommunityMarkRepository._();

  @override
  int? id;

  int memberId;

  _i92g8nq1.CommunityMarkKind kind;

  _i9cc7j0c.CommunityTarget target;

  int targetId;

  /// Why it was reported (reports only).
  String? reason;

  DateTime createdAt;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [CommunityMark]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityMark copyWith({
    int? id,
    int? memberId,
    _i92g8nq1.CommunityMarkKind? kind,
    _i9cc7j0c.CommunityTarget? target,
    int? targetId,
    String? reason,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityMark',
      if (id != null) 'id': id,
      'memberId': memberId,
      'kind': kind.toJson(),
      'target': target.toJson(),
      'targetId': targetId,
      if (reason != null) 'reason': reason,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityMark',
      if (id != null) 'id': id,
      'memberId': memberId,
      'kind': kind.toJson(),
      'target': target.toJson(),
      'targetId': targetId,
      if (reason != null) 'reason': reason,
      'createdAt': createdAt.toJson(),
    };
  }

  static CommunityMarkInclude include() {
    return CommunityMarkInclude._();
  }

  static CommunityMarkIncludeList includeList({
    _is.WhereExpressionBuilder<CommunityMarkTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    CommunityMarkInclude? include,
  }) {
    return CommunityMarkIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityMarkImpl extends CommunityMark {
  _CommunityMarkImpl({
    int? id,
    required int memberId,
    required _i92g8nq1.CommunityMarkKind kind,
    required _i9cc7j0c.CommunityTarget target,
    required int targetId,
    String? reason,
    DateTime? createdAt,
  }) : super._(
         id: id,
         memberId: memberId,
         kind: kind,
         target: target,
         targetId: targetId,
         reason: reason,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [CommunityMark]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityMark copyWith({
    Object? id = _Undefined,
    int? memberId,
    _i92g8nq1.CommunityMarkKind? kind,
    _i9cc7j0c.CommunityTarget? target,
    int? targetId,
    Object? reason = _Undefined,
    DateTime? createdAt,
  }) {
    return CommunityMark(
      id: id is int? ? id : this.id,
      memberId: memberId ?? this.memberId,
      kind: kind ?? this.kind,
      target: target ?? this.target,
      targetId: targetId ?? this.targetId,
      reason: reason is String? ? reason : this.reason,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class CommunityMarkUpdateTable extends _is.UpdateTable<CommunityMarkTable> {
  CommunityMarkUpdateTable(super.table);

  _is.ColumnValue<int, int> memberId(int value) => _is.ColumnValue(
    table.memberId,
    value,
  );

  _is.ColumnValue<_i92g8nq1.CommunityMarkKind, _i92g8nq1.CommunityMarkKind>
  kind(_i92g8nq1.CommunityMarkKind value) => _is.ColumnValue(
    table.kind,
    value,
  );

  _is.ColumnValue<_i9cc7j0c.CommunityTarget, _i9cc7j0c.CommunityTarget> target(
    _i9cc7j0c.CommunityTarget value,
  ) => _is.ColumnValue(
    table.target,
    value,
  );

  _is.ColumnValue<int, int> targetId(int value) => _is.ColumnValue(
    table.targetId,
    value,
  );

  _is.ColumnValue<String, String> reason(String? value) => _is.ColumnValue(
    table.reason,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> createdAt(DateTime value) =>
      _is.ColumnValue(
        table.createdAt,
        value,
      );
}

class CommunityMarkTable extends _is.Table<int?> {
  CommunityMarkTable({super.tableRelation})
    : super(tableName: 'community_mark') {
    updateTable = CommunityMarkUpdateTable(this);
    memberId = _is.ColumnInt(
      'memberId',
      this,
    );
    kind = _is.ColumnEnum(
      'kind',
      this,
      _is.EnumSerialization.byName,
    );
    target = _is.ColumnEnum(
      'target',
      this,
      _is.EnumSerialization.byName,
    );
    targetId = _is.ColumnInt(
      'targetId',
      this,
    );
    reason = _is.ColumnString(
      'reason',
      this,
    );
    createdAt = _is.ColumnDateTime(
      'createdAt',
      this,
      hasDefault: true,
    );
  }

  late final CommunityMarkUpdateTable updateTable;

  late final _is.ColumnInt memberId;

  late final _is.ColumnEnum<_i92g8nq1.CommunityMarkKind> kind;

  late final _is.ColumnEnum<_i9cc7j0c.CommunityTarget> target;

  late final _is.ColumnInt targetId;

  /// Why it was reported (reports only).
  late final _is.ColumnString reason;

  late final _is.ColumnDateTime createdAt;

  @override
  List<_is.Column> get columns => [
    id,
    memberId,
    kind,
    target,
    targetId,
    reason,
    createdAt,
  ];
}

class CommunityMarkInclude extends _is.IncludeObject {
  CommunityMarkInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => CommunityMark.t;
}

class CommunityMarkIncludeList extends _is.IncludeList {
  CommunityMarkIncludeList._({
    _is.WhereExpressionBuilder<CommunityMarkTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(CommunityMark.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => CommunityMark.t;
}

class CommunityMarkRepository {
  const CommunityMarkRepository._();

  /// Returns a list of [CommunityMark]s matching the given query parameters.
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
  Future<List<CommunityMark>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMarkTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<CommunityMark>(
      where: where?.call(CommunityMark.t),
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [CommunityMark]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `CommunityMark.t`.
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
  _ida.Stream<List<CommunityMark>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMarkTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<CommunityMark>(
      where: where?.call(CommunityMark.t),
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [CommunityMark] matching the given query parameters.
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
  Future<CommunityMark?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMarkTable>? where,
    int? offset,
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<CommunityMark>(
      where: where?.call(CommunityMark.t),
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [CommunityMark] by its [id] or null if no such row exists.
  Future<CommunityMark?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<CommunityMark>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [CommunityMark]s in the list and returns the inserted rows.
  ///
  /// The returned [CommunityMark]s will have their `id` fields set.
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
  Future<List<CommunityMark>> insert(
    _is.DatabaseSession session,
    List<CommunityMark> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<CommunityMark>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [CommunityMark] and returns the inserted row.
  ///
  /// The returned [CommunityMark] will have its `id` field set.
  Future<CommunityMark> insertRow(
    _is.DatabaseSession session,
    CommunityMark row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<CommunityMark>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [CommunityMark]s in the list and returns the resulting rows.
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
  /// The returned [CommunityMark]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMark>> upsert(
    _is.DatabaseSession session,
    List<CommunityMark> rows, {
    required _is.ColumnSelections<CommunityMarkTable> conflictColumns,
    _is.ColumnSelections<CommunityMarkTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityMarkTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<CommunityMark>(
      rows,
      conflictColumns: conflictColumns(CommunityMark.t),
      updateColumns: updateColumns?.call(CommunityMark.t),
      updateWhere: updateWhere?.call(CommunityMark.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [CommunityMark] and returns the resulting row.
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
  /// The returned [CommunityMark] will have its `id` field set.
  Future<CommunityMark?> upsertRow(
    _is.DatabaseSession session,
    CommunityMark row, {
    required _is.ColumnSelections<CommunityMarkTable> conflictColumns,
    _is.ColumnSelections<CommunityMarkTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityMarkTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<CommunityMark>(
      row,
      conflictColumns: conflictColumns(CommunityMark.t),
      updateColumns: updateColumns?.call(CommunityMark.t),
      updateWhere: updateWhere?.call(CommunityMark.t),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityMark]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMark>> update(
    _is.DatabaseSession session,
    List<CommunityMark> rows, {
    _is.ColumnSelections<CommunityMarkTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<CommunityMark>(
      rows,
      columns: columns?.call(CommunityMark.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [CommunityMark]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<CommunityMark> updateRow(
    _is.DatabaseSession session,
    CommunityMark row, {
    _is.ColumnSelections<CommunityMarkTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<CommunityMark>(
      row,
      columns: columns?.call(CommunityMark.t),
      transaction: transaction,
    );
  }

  /// Updates a single [CommunityMark] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<CommunityMark?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<CommunityMarkUpdateTable> columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<CommunityMark>(
      id,
      columnValues: columnValues(CommunityMark.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityMark]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityMark>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<CommunityMarkUpdateTable> columnValues,
    required _is.WhereExpressionBuilder<CommunityMarkTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<CommunityMark>(
      columnValues: columnValues(CommunityMark.t.updateTable),
      where: where(CommunityMark.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [CommunityMark]s in the list and returns the deleted rows.
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
  Future<List<CommunityMark>> delete(
    _is.DatabaseSession session,
    List<CommunityMark> rows, {
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<CommunityMark>(
      rows,
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [CommunityMark].
  Future<CommunityMark> deleteRow(
    _is.DatabaseSession session,
    CommunityMark row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<CommunityMark>(
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
  Future<List<CommunityMark>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityMarkTable> where,
    _is.OrderByBuilder<CommunityMarkTable>? orderBy,
    _is.OrderByListBuilder<CommunityMarkTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<CommunityMark>(
      where: where(CommunityMark.t),
      orderBy: orderBy?.call(CommunityMark.t),
      orderByList: orderByList?.call(CommunityMark.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityMarkTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<CommunityMark>(
      where: where?.call(CommunityMark.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [CommunityMark] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityMarkTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<CommunityMark>(
      where: where(CommunityMark.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
