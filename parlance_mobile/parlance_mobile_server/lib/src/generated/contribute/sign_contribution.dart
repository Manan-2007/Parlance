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
import '../contribute/contribution_status.dart' as _ioqavim0;

/// One recorded sign: hand positions only (never video), and the word.
abstract class SignContribution
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  SignContribution._({
    this.id,
    this.userId,
    required this.gloss,
    required this.frames,
    required this.frameCount,
    DateTime? createdAt,
    required this.status,
    int? correctVotes,
    int? wrongVotes,
  }) : createdAt = createdAt ?? DateTime.now(),
       correctVotes = correctVotes ?? 0,
       wrongVotes = wrongVotes ?? 0;

  factory SignContribution({
    int? id,
    String? userId,
    required String gloss,
    required List<double> frames,
    required int frameCount,
    DateTime? createdAt,
    required _ioqavim0.ContributionStatus status,
    int? correctVotes,
    int? wrongVotes,
  }) = _SignContributionImpl;

  factory SignContribution.fromJson(Map<String, dynamic> jsonSerialization) {
    return SignContribution(
      id: jsonSerialization['id'] as int?,
      userId: jsonSerialization['userId'] as String?,
      gloss: jsonSerialization['gloss'] as String,
      frames: _ireuocbz.Protocol().deserialize<List<double>>(
        jsonSerialization['frames'],
      ),
      frameCount: jsonSerialization['frameCount'] as int,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      status: _ioqavim0.ContributionStatus.fromJson(
        (jsonSerialization['status'] as String),
      ),
      correctVotes: jsonSerialization['correctVotes'] as int?,
      wrongVotes: jsonSerialization['wrongVotes'] as int?,
    );
  }

  static final t = SignContributionTable();

  static const db = SignContributionRepository._();

  @override
  int? id;

  String? userId;

  /// The recogniser's word key (glossKey), e.g. "thankyou".
  String gloss;

  /// frameCount x 141 numbers, the same layout the recogniser reads.
  List<double> frames;

  int frameCount;

  DateTime createdAt;

  _ioqavim0.ContributionStatus status;

  int correctVotes;

  int wrongVotes;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [SignContribution]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  SignContribution copyWith({
    int? id,
    String? userId,
    String? gloss,
    List<double>? frames,
    int? frameCount,
    DateTime? createdAt,
    _ioqavim0.ContributionStatus? status,
    int? correctVotes,
    int? wrongVotes,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'SignContribution',
      if (id != null) 'id': id,
      if (userId != null) 'userId': userId,
      'gloss': gloss,
      'frames': frames.toJson(),
      'frameCount': frameCount,
      'createdAt': createdAt.toJson(),
      'status': status.toJson(),
      'correctVotes': correctVotes,
      'wrongVotes': wrongVotes,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'SignContribution',
      if (id != null) 'id': id,
      'gloss': gloss,
      'frames': frames.toJson(),
      'frameCount': frameCount,
      'createdAt': createdAt.toJson(),
      'status': status.toJson(),
      'correctVotes': correctVotes,
      'wrongVotes': wrongVotes,
    };
  }

  static SignContributionInclude include() {
    return SignContributionInclude._();
  }

  static SignContributionIncludeList includeList({
    _is.WhereExpressionBuilder<SignContributionTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    SignContributionInclude? include,
  }) {
    return SignContributionIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _SignContributionImpl extends SignContribution {
  _SignContributionImpl({
    int? id,
    String? userId,
    required String gloss,
    required List<double> frames,
    required int frameCount,
    DateTime? createdAt,
    required _ioqavim0.ContributionStatus status,
    int? correctVotes,
    int? wrongVotes,
  }) : super._(
         id: id,
         userId: userId,
         gloss: gloss,
         frames: frames,
         frameCount: frameCount,
         createdAt: createdAt,
         status: status,
         correctVotes: correctVotes,
         wrongVotes: wrongVotes,
       );

  /// Returns a shallow copy of this [SignContribution]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  SignContribution copyWith({
    Object? id = _Undefined,
    Object? userId = _Undefined,
    String? gloss,
    List<double>? frames,
    int? frameCount,
    DateTime? createdAt,
    _ioqavim0.ContributionStatus? status,
    int? correctVotes,
    int? wrongVotes,
  }) {
    return SignContribution(
      id: id is int? ? id : this.id,
      userId: userId is String? ? userId : this.userId,
      gloss: gloss ?? this.gloss,
      frames: frames ?? this.frames.map((e0) => e0).toList(),
      frameCount: frameCount ?? this.frameCount,
      createdAt: createdAt ?? this.createdAt,
      status: status ?? this.status,
      correctVotes: correctVotes ?? this.correctVotes,
      wrongVotes: wrongVotes ?? this.wrongVotes,
    );
  }
}

class SignContributionUpdateTable
    extends _is.UpdateTable<SignContributionTable> {
  SignContributionUpdateTable(super.table);

  _is.ColumnValue<String, String> userId(String? value) => _is.ColumnValue(
    table.userId,
    value,
  );

  _is.ColumnValue<String, String> gloss(String value) => _is.ColumnValue(
    table.gloss,
    value,
  );

  _is.ColumnValue<List<double>, List<double>> frames(List<double> value) =>
      _is.ColumnValue(
        table.frames,
        value,
      );

  _is.ColumnValue<int, int> frameCount(int value) => _is.ColumnValue(
    table.frameCount,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> createdAt(DateTime value) =>
      _is.ColumnValue(
        table.createdAt,
        value,
      );

  _is.ColumnValue<_ioqavim0.ContributionStatus, _ioqavim0.ContributionStatus>
  status(_ioqavim0.ContributionStatus value) => _is.ColumnValue(
    table.status,
    value,
  );

  _is.ColumnValue<int, int> correctVotes(int value) => _is.ColumnValue(
    table.correctVotes,
    value,
  );

  _is.ColumnValue<int, int> wrongVotes(int value) => _is.ColumnValue(
    table.wrongVotes,
    value,
  );
}

class SignContributionTable extends _is.Table<int?> {
  SignContributionTable({super.tableRelation})
    : super(tableName: 'sign_contribution') {
    updateTable = SignContributionUpdateTable(this);
    userId = _is.ColumnString(
      'userId',
      this,
    );
    gloss = _is.ColumnString(
      'gloss',
      this,
    );
    frames = _is.ColumnSerializable<List<double>>(
      'frames',
      this,
    );
    frameCount = _is.ColumnInt(
      'frameCount',
      this,
    );
    createdAt = _is.ColumnDateTime(
      'createdAt',
      this,
      hasDefault: true,
    );
    status = _is.ColumnEnum(
      'status',
      this,
      _is.EnumSerialization.byName,
    );
    correctVotes = _is.ColumnInt(
      'correctVotes',
      this,
      hasDefault: true,
    );
    wrongVotes = _is.ColumnInt(
      'wrongVotes',
      this,
      hasDefault: true,
    );
  }

  late final SignContributionUpdateTable updateTable;

  late final _is.ColumnString userId;

  /// The recogniser's word key (glossKey), e.g. "thankyou".
  late final _is.ColumnString gloss;

  /// frameCount x 141 numbers, the same layout the recogniser reads.
  late final _is.ColumnSerializable<List<double>> frames;

  late final _is.ColumnInt frameCount;

  late final _is.ColumnDateTime createdAt;

  late final _is.ColumnEnum<_ioqavim0.ContributionStatus> status;

  late final _is.ColumnInt correctVotes;

  late final _is.ColumnInt wrongVotes;

  @override
  List<_is.Column> get columns => [
    id,
    userId,
    gloss,
    frames,
    frameCount,
    createdAt,
    status,
    correctVotes,
    wrongVotes,
  ];
}

class SignContributionInclude extends _is.IncludeObject {
  SignContributionInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => SignContribution.t;
}

class SignContributionIncludeList extends _is.IncludeList {
  SignContributionIncludeList._({
    _is.WhereExpressionBuilder<SignContributionTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(SignContribution.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => SignContribution.t;
}

class SignContributionRepository {
  const SignContributionRepository._();

  /// Returns a list of [SignContribution]s matching the given query parameters.
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
  Future<List<SignContribution>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<SignContributionTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<SignContribution>(
      where: where?.call(SignContribution.t),
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [SignContribution]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `SignContribution.t`.
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
  _ida.Stream<List<SignContribution>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<SignContributionTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<SignContribution>(
      where: where?.call(SignContribution.t),
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [SignContribution] matching the given query parameters.
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
  Future<SignContribution?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<SignContributionTable>? where,
    int? offset,
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<SignContribution>(
      where: where?.call(SignContribution.t),
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [SignContribution] by its [id] or null if no such row exists.
  Future<SignContribution?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<SignContribution>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [SignContribution]s in the list and returns the inserted rows.
  ///
  /// The returned [SignContribution]s will have their `id` fields set.
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
  Future<List<SignContribution>> insert(
    _is.DatabaseSession session,
    List<SignContribution> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<SignContribution>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [SignContribution] and returns the inserted row.
  ///
  /// The returned [SignContribution] will have its `id` field set.
  Future<SignContribution> insertRow(
    _is.DatabaseSession session,
    SignContribution row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<SignContribution>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [SignContribution]s in the list and returns the resulting rows.
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
  /// The returned [SignContribution]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<SignContribution>> upsert(
    _is.DatabaseSession session,
    List<SignContribution> rows, {
    required _is.ColumnSelections<SignContributionTable> conflictColumns,
    _is.ColumnSelections<SignContributionTable>? updateColumns,
    _is.WhereExpressionBuilder<SignContributionTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<SignContribution>(
      rows,
      conflictColumns: conflictColumns(SignContribution.t),
      updateColumns: updateColumns?.call(SignContribution.t),
      updateWhere: updateWhere?.call(SignContribution.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [SignContribution] and returns the resulting row.
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
  /// The returned [SignContribution] will have its `id` field set.
  Future<SignContribution?> upsertRow(
    _is.DatabaseSession session,
    SignContribution row, {
    required _is.ColumnSelections<SignContributionTable> conflictColumns,
    _is.ColumnSelections<SignContributionTable>? updateColumns,
    _is.WhereExpressionBuilder<SignContributionTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<SignContribution>(
      row,
      conflictColumns: conflictColumns(SignContribution.t),
      updateColumns: updateColumns?.call(SignContribution.t),
      updateWhere: updateWhere?.call(SignContribution.t),
      transaction: transaction,
    );
  }

  /// Updates all [SignContribution]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<SignContribution>> update(
    _is.DatabaseSession session,
    List<SignContribution> rows, {
    _is.ColumnSelections<SignContributionTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<SignContribution>(
      rows,
      columns: columns?.call(SignContribution.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [SignContribution]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<SignContribution> updateRow(
    _is.DatabaseSession session,
    SignContribution row, {
    _is.ColumnSelections<SignContributionTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<SignContribution>(
      row,
      columns: columns?.call(SignContribution.t),
      transaction: transaction,
    );
  }

  /// Updates a single [SignContribution] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<SignContribution?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<SignContributionUpdateTable>
    columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<SignContribution>(
      id,
      columnValues: columnValues(SignContribution.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [SignContribution]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<SignContribution>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<SignContributionUpdateTable>
    columnValues,
    required _is.WhereExpressionBuilder<SignContributionTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<SignContribution>(
      columnValues: columnValues(SignContribution.t.updateTable),
      where: where(SignContribution.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [SignContribution]s in the list and returns the deleted rows.
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
  Future<List<SignContribution>> delete(
    _is.DatabaseSession session,
    List<SignContribution> rows, {
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<SignContribution>(
      rows,
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [SignContribution].
  Future<SignContribution> deleteRow(
    _is.DatabaseSession session,
    SignContribution row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<SignContribution>(
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
  Future<List<SignContribution>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<SignContributionTable> where,
    _is.OrderByBuilder<SignContributionTable>? orderBy,
    _is.OrderByListBuilder<SignContributionTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<SignContribution>(
      where: where(SignContribution.t),
      orderBy: orderBy?.call(SignContribution.t),
      orderByList: orderByList?.call(SignContribution.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<SignContributionTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<SignContribution>(
      where: where?.call(SignContribution.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [SignContribution] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<SignContributionTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<SignContribution>(
      where: where(SignContribution.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
