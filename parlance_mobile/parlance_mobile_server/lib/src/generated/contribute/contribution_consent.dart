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

/// Someone's consent to contribute signs for training the sign reader.
/// Deleted, with everything they gave, when they withdraw.
abstract class ContributionConsent
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  ContributionConsent._({
    this.id,
    this.userId,
    required this.version,
    DateTime? givenAt,
    bool? reviewer,
  }) : givenAt = givenAt ?? DateTime.now(),
       reviewer = reviewer ?? false;

  factory ContributionConsent({
    int? id,
    String? userId,
    required String version,
    DateTime? givenAt,
    bool? reviewer,
  }) = _ContributionConsentImpl;

  factory ContributionConsent.fromJson(Map<String, dynamic> jsonSerialization) {
    return ContributionConsent(
      id: jsonSerialization['id'] as int?,
      userId: jsonSerialization['userId'] as String?,
      version: jsonSerialization['version'] as String,
      givenAt: jsonSerialization['givenAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['givenAt']),
      reviewer: jsonSerialization['reviewer'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['reviewer']),
    );
  }

  static final t = ContributionConsentTable();

  static const db = ContributionConsentRepository._();

  @override
  int? id;

  /// The signed-in account. Never sent to phones.
  String? userId;

  /// Which consent text they agreed to (ContributeEndpoint.consentVersion).
  String version;

  DateTime givenAt;

  /// They also check other people's signs (self-reported fluent signer).
  bool reviewer;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [ContributionConsent]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  ContributionConsent copyWith({
    int? id,
    String? userId,
    String? version,
    DateTime? givenAt,
    bool? reviewer,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'ContributionConsent',
      if (id != null) 'id': id,
      if (userId != null) 'userId': userId,
      'version': version,
      'givenAt': givenAt.toJson(),
      'reviewer': reviewer,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'ContributionConsent',
      if (id != null) 'id': id,
      'version': version,
      'givenAt': givenAt.toJson(),
      'reviewer': reviewer,
    };
  }

  static ContributionConsentInclude include() {
    return ContributionConsentInclude._();
  }

  static ContributionConsentIncludeList includeList({
    _is.WhereExpressionBuilder<ContributionConsentTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    ContributionConsentInclude? include,
  }) {
    return ContributionConsentIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _ContributionConsentImpl extends ContributionConsent {
  _ContributionConsentImpl({
    int? id,
    String? userId,
    required String version,
    DateTime? givenAt,
    bool? reviewer,
  }) : super._(
         id: id,
         userId: userId,
         version: version,
         givenAt: givenAt,
         reviewer: reviewer,
       );

  /// Returns a shallow copy of this [ContributionConsent]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  ContributionConsent copyWith({
    Object? id = _Undefined,
    Object? userId = _Undefined,
    String? version,
    DateTime? givenAt,
    bool? reviewer,
  }) {
    return ContributionConsent(
      id: id is int? ? id : this.id,
      userId: userId is String? ? userId : this.userId,
      version: version ?? this.version,
      givenAt: givenAt ?? this.givenAt,
      reviewer: reviewer ?? this.reviewer,
    );
  }
}

class ContributionConsentUpdateTable
    extends _is.UpdateTable<ContributionConsentTable> {
  ContributionConsentUpdateTable(super.table);

  _is.ColumnValue<String, String> userId(String? value) => _is.ColumnValue(
    table.userId,
    value,
  );

  _is.ColumnValue<String, String> version(String value) => _is.ColumnValue(
    table.version,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> givenAt(DateTime value) =>
      _is.ColumnValue(
        table.givenAt,
        value,
      );

  _is.ColumnValue<bool, bool> reviewer(bool value) => _is.ColumnValue(
    table.reviewer,
    value,
  );
}

class ContributionConsentTable extends _is.Table<int?> {
  ContributionConsentTable({super.tableRelation})
    : super(tableName: 'contribution_consent') {
    updateTable = ContributionConsentUpdateTable(this);
    userId = _is.ColumnString(
      'userId',
      this,
    );
    version = _is.ColumnString(
      'version',
      this,
    );
    givenAt = _is.ColumnDateTime(
      'givenAt',
      this,
      hasDefault: true,
    );
    reviewer = _is.ColumnBool(
      'reviewer',
      this,
      hasDefault: true,
    );
  }

  late final ContributionConsentUpdateTable updateTable;

  /// The signed-in account. Never sent to phones.
  late final _is.ColumnString userId;

  /// Which consent text they agreed to (ContributeEndpoint.consentVersion).
  late final _is.ColumnString version;

  late final _is.ColumnDateTime givenAt;

  /// They also check other people's signs (self-reported fluent signer).
  late final _is.ColumnBool reviewer;

  @override
  List<_is.Column> get columns => [
    id,
    userId,
    version,
    givenAt,
    reviewer,
  ];
}

class ContributionConsentInclude extends _is.IncludeObject {
  ContributionConsentInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => ContributionConsent.t;
}

class ContributionConsentIncludeList extends _is.IncludeList {
  ContributionConsentIncludeList._({
    _is.WhereExpressionBuilder<ContributionConsentTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(ContributionConsent.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => ContributionConsent.t;
}

class ContributionConsentRepository {
  const ContributionConsentRepository._();

  /// Returns a list of [ContributionConsent]s matching the given query parameters.
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
  Future<List<ContributionConsent>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<ContributionConsentTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<ContributionConsent>(
      where: where?.call(ContributionConsent.t),
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [ContributionConsent]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `ContributionConsent.t`.
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
  _ida.Stream<List<ContributionConsent>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<ContributionConsentTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<ContributionConsent>(
      where: where?.call(ContributionConsent.t),
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [ContributionConsent] matching the given query parameters.
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
  Future<ContributionConsent?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<ContributionConsentTable>? where,
    int? offset,
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<ContributionConsent>(
      where: where?.call(ContributionConsent.t),
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [ContributionConsent] by its [id] or null if no such row exists.
  Future<ContributionConsent?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<ContributionConsent>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [ContributionConsent]s in the list and returns the inserted rows.
  ///
  /// The returned [ContributionConsent]s will have their `id` fields set.
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
  Future<List<ContributionConsent>> insert(
    _is.DatabaseSession session,
    List<ContributionConsent> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<ContributionConsent>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [ContributionConsent] and returns the inserted row.
  ///
  /// The returned [ContributionConsent] will have its `id` field set.
  Future<ContributionConsent> insertRow(
    _is.DatabaseSession session,
    ContributionConsent row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<ContributionConsent>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [ContributionConsent]s in the list and returns the resulting rows.
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
  /// The returned [ContributionConsent]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<ContributionConsent>> upsert(
    _is.DatabaseSession session,
    List<ContributionConsent> rows, {
    required _is.ColumnSelections<ContributionConsentTable> conflictColumns,
    _is.ColumnSelections<ContributionConsentTable>? updateColumns,
    _is.WhereExpressionBuilder<ContributionConsentTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<ContributionConsent>(
      rows,
      conflictColumns: conflictColumns(ContributionConsent.t),
      updateColumns: updateColumns?.call(ContributionConsent.t),
      updateWhere: updateWhere?.call(ContributionConsent.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [ContributionConsent] and returns the resulting row.
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
  /// The returned [ContributionConsent] will have its `id` field set.
  Future<ContributionConsent?> upsertRow(
    _is.DatabaseSession session,
    ContributionConsent row, {
    required _is.ColumnSelections<ContributionConsentTable> conflictColumns,
    _is.ColumnSelections<ContributionConsentTable>? updateColumns,
    _is.WhereExpressionBuilder<ContributionConsentTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<ContributionConsent>(
      row,
      conflictColumns: conflictColumns(ContributionConsent.t),
      updateColumns: updateColumns?.call(ContributionConsent.t),
      updateWhere: updateWhere?.call(ContributionConsent.t),
      transaction: transaction,
    );
  }

  /// Updates all [ContributionConsent]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<ContributionConsent>> update(
    _is.DatabaseSession session,
    List<ContributionConsent> rows, {
    _is.ColumnSelections<ContributionConsentTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<ContributionConsent>(
      rows,
      columns: columns?.call(ContributionConsent.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [ContributionConsent]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<ContributionConsent> updateRow(
    _is.DatabaseSession session,
    ContributionConsent row, {
    _is.ColumnSelections<ContributionConsentTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<ContributionConsent>(
      row,
      columns: columns?.call(ContributionConsent.t),
      transaction: transaction,
    );
  }

  /// Updates a single [ContributionConsent] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<ContributionConsent?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<ContributionConsentUpdateTable>
    columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<ContributionConsent>(
      id,
      columnValues: columnValues(ContributionConsent.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [ContributionConsent]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<ContributionConsent>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<ContributionConsentUpdateTable>
    columnValues,
    required _is.WhereExpressionBuilder<ContributionConsentTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<ContributionConsent>(
      columnValues: columnValues(ContributionConsent.t.updateTable),
      where: where(ContributionConsent.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [ContributionConsent]s in the list and returns the deleted rows.
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
  Future<List<ContributionConsent>> delete(
    _is.DatabaseSession session,
    List<ContributionConsent> rows, {
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<ContributionConsent>(
      rows,
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [ContributionConsent].
  Future<ContributionConsent> deleteRow(
    _is.DatabaseSession session,
    ContributionConsent row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<ContributionConsent>(
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
  Future<List<ContributionConsent>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<ContributionConsentTable> where,
    _is.OrderByBuilder<ContributionConsentTable>? orderBy,
    _is.OrderByListBuilder<ContributionConsentTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<ContributionConsent>(
      where: where(ContributionConsent.t),
      orderBy: orderBy?.call(ContributionConsent.t),
      orderByList: orderByList?.call(ContributionConsent.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<ContributionConsentTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<ContributionConsent>(
      where: where?.call(ContributionConsent.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [ContributionConsent] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<ContributionConsentTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<ContributionConsent>(
      where: where(ContributionConsent.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
