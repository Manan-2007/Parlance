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
import '../community/community_input.dart' as _iiihb1zv;

/// A reply in a thread.
abstract class CommunityReply
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  CommunityReply._({
    this.id,
    required this.threadId,
    required this.authorId,
    required this.body,
    required this.input,
    this.quoteId,
    DateTime? createdAt,
    this.editedAt,
    bool? hidden,
    bool? deleted,
  }) : createdAt = createdAt ?? DateTime.now(),
       hidden = hidden ?? false,
       deleted = deleted ?? false;

  factory CommunityReply({
    int? id,
    required int threadId,
    required int authorId,
    required String body,
    required _iiihb1zv.CommunityInput input,
    int? quoteId,
    DateTime? createdAt,
    DateTime? editedAt,
    bool? hidden,
    bool? deleted,
  }) = _CommunityReplyImpl;

  factory CommunityReply.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityReply(
      id: jsonSerialization['id'] as int?,
      threadId: jsonSerialization['threadId'] as int,
      authorId: jsonSerialization['authorId'] as int,
      body: jsonSerialization['body'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      quoteId: jsonSerialization['quoteId'] as int?,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      editedAt: jsonSerialization['editedAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['editedAt']),
      hidden: jsonSerialization['hidden'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['hidden']),
      deleted: jsonSerialization['deleted'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['deleted']),
    );
  }

  static final t = CommunityReplyTable();

  static const db = CommunityReplyRepository._();

  @override
  int? id;

  int threadId;

  int authorId;

  String body;

  _iiihb1zv.CommunityInput input;

  /// The reply this one answers, if any.
  int? quoteId;

  DateTime createdAt;

  DateTime? editedAt;

  bool hidden;

  bool deleted;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [CommunityReply]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityReply copyWith({
    int? id,
    int? threadId,
    int? authorId,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? quoteId,
    DateTime? createdAt,
    DateTime? editedAt = const _is.$UndefinedDateTime(),
    bool? hidden,
    bool? deleted,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityReply',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'body': body,
      'input': input.toJson(),
      if (quoteId != null) 'quoteId': quoteId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'hidden': hidden,
      'deleted': deleted,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityReply',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'body': body,
      'input': input.toJson(),
      if (quoteId != null) 'quoteId': quoteId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'hidden': hidden,
      'deleted': deleted,
    };
  }

  static CommunityReplyInclude include() {
    return CommunityReplyInclude._();
  }

  static CommunityReplyIncludeList includeList({
    _is.WhereExpressionBuilder<CommunityReplyTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    CommunityReplyInclude? include,
  }) {
    return CommunityReplyIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityReplyImpl extends CommunityReply {
  _CommunityReplyImpl({
    int? id,
    required int threadId,
    required int authorId,
    required String body,
    required _iiihb1zv.CommunityInput input,
    int? quoteId,
    DateTime? createdAt,
    DateTime? editedAt,
    bool? hidden,
    bool? deleted,
  }) : super._(
         id: id,
         threadId: threadId,
         authorId: authorId,
         body: body,
         input: input,
         quoteId: quoteId,
         createdAt: createdAt,
         editedAt: editedAt,
         hidden: hidden,
         deleted: deleted,
       );

  /// Returns a shallow copy of this [CommunityReply]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityReply copyWith({
    Object? id = _Undefined,
    int? threadId,
    int? authorId,
    String? body,
    _iiihb1zv.CommunityInput? input,
    Object? quoteId = _Undefined,
    DateTime? createdAt,
    DateTime? editedAt = const _is.$UndefinedDateTime(),
    bool? hidden,
    bool? deleted,
  }) {
    return CommunityReply(
      id: id is int? ? id : this.id,
      threadId: threadId ?? this.threadId,
      authorId: authorId ?? this.authorId,
      body: body ?? this.body,
      input: input ?? this.input,
      quoteId: quoteId is int? ? quoteId : this.quoteId,
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt is _is.UndefinedSentinel ? this.editedAt : editedAt,
      hidden: hidden ?? this.hidden,
      deleted: deleted ?? this.deleted,
    );
  }
}

class CommunityReplyUpdateTable extends _is.UpdateTable<CommunityReplyTable> {
  CommunityReplyUpdateTable(super.table);

  _is.ColumnValue<int, int> threadId(int value) => _is.ColumnValue(
    table.threadId,
    value,
  );

  _is.ColumnValue<int, int> authorId(int value) => _is.ColumnValue(
    table.authorId,
    value,
  );

  _is.ColumnValue<String, String> body(String value) => _is.ColumnValue(
    table.body,
    value,
  );

  _is.ColumnValue<_iiihb1zv.CommunityInput, _iiihb1zv.CommunityInput> input(
    _iiihb1zv.CommunityInput value,
  ) => _is.ColumnValue(
    table.input,
    value,
  );

  _is.ColumnValue<int, int> quoteId(int? value) => _is.ColumnValue(
    table.quoteId,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> createdAt(DateTime value) =>
      _is.ColumnValue(
        table.createdAt,
        value,
      );

  _is.ColumnValue<DateTime, DateTime> editedAt(DateTime? value) =>
      _is.ColumnValue(
        table.editedAt,
        value,
      );

  _is.ColumnValue<bool, bool> hidden(bool value) => _is.ColumnValue(
    table.hidden,
    value,
  );

  _is.ColumnValue<bool, bool> deleted(bool value) => _is.ColumnValue(
    table.deleted,
    value,
  );
}

class CommunityReplyTable extends _is.Table<int?> {
  CommunityReplyTable({super.tableRelation})
    : super(tableName: 'community_reply') {
    updateTable = CommunityReplyUpdateTable(this);
    threadId = _is.ColumnInt(
      'threadId',
      this,
    );
    authorId = _is.ColumnInt(
      'authorId',
      this,
    );
    body = _is.ColumnString(
      'body',
      this,
    );
    input = _is.ColumnEnum(
      'input',
      this,
      _is.EnumSerialization.byName,
    );
    quoteId = _is.ColumnInt(
      'quoteId',
      this,
    );
    createdAt = _is.ColumnDateTime(
      'createdAt',
      this,
      hasDefault: true,
    );
    editedAt = _is.ColumnDateTime(
      'editedAt',
      this,
    );
    hidden = _is.ColumnBool(
      'hidden',
      this,
      hasDefault: true,
    );
    deleted = _is.ColumnBool(
      'deleted',
      this,
      hasDefault: true,
    );
  }

  late final CommunityReplyUpdateTable updateTable;

  late final _is.ColumnInt threadId;

  late final _is.ColumnInt authorId;

  late final _is.ColumnString body;

  late final _is.ColumnEnum<_iiihb1zv.CommunityInput> input;

  /// The reply this one answers, if any.
  late final _is.ColumnInt quoteId;

  late final _is.ColumnDateTime createdAt;

  late final _is.ColumnDateTime editedAt;

  late final _is.ColumnBool hidden;

  late final _is.ColumnBool deleted;

  @override
  List<_is.Column> get columns => [
    id,
    threadId,
    authorId,
    body,
    input,
    quoteId,
    createdAt,
    editedAt,
    hidden,
    deleted,
  ];
}

class CommunityReplyInclude extends _is.IncludeObject {
  CommunityReplyInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => CommunityReply.t;
}

class CommunityReplyIncludeList extends _is.IncludeList {
  CommunityReplyIncludeList._({
    _is.WhereExpressionBuilder<CommunityReplyTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(CommunityReply.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => CommunityReply.t;
}

class CommunityReplyRepository {
  const CommunityReplyRepository._();

  /// Returns a list of [CommunityReply]s matching the given query parameters.
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
  Future<List<CommunityReply>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityReplyTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<CommunityReply>(
      where: where?.call(CommunityReply.t),
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [CommunityReply]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `CommunityReply.t`.
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
  _ida.Stream<List<CommunityReply>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityReplyTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<CommunityReply>(
      where: where?.call(CommunityReply.t),
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [CommunityReply] matching the given query parameters.
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
  Future<CommunityReply?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityReplyTable>? where,
    int? offset,
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<CommunityReply>(
      where: where?.call(CommunityReply.t),
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [CommunityReply] by its [id] or null if no such row exists.
  Future<CommunityReply?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<CommunityReply>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [CommunityReply]s in the list and returns the inserted rows.
  ///
  /// The returned [CommunityReply]s will have their `id` fields set.
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
  Future<List<CommunityReply>> insert(
    _is.DatabaseSession session,
    List<CommunityReply> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<CommunityReply>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [CommunityReply] and returns the inserted row.
  ///
  /// The returned [CommunityReply] will have its `id` field set.
  Future<CommunityReply> insertRow(
    _is.DatabaseSession session,
    CommunityReply row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<CommunityReply>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [CommunityReply]s in the list and returns the resulting rows.
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
  /// The returned [CommunityReply]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityReply>> upsert(
    _is.DatabaseSession session,
    List<CommunityReply> rows, {
    required _is.ColumnSelections<CommunityReplyTable> conflictColumns,
    _is.ColumnSelections<CommunityReplyTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityReplyTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<CommunityReply>(
      rows,
      conflictColumns: conflictColumns(CommunityReply.t),
      updateColumns: updateColumns?.call(CommunityReply.t),
      updateWhere: updateWhere?.call(CommunityReply.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [CommunityReply] and returns the resulting row.
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
  /// The returned [CommunityReply] will have its `id` field set.
  Future<CommunityReply?> upsertRow(
    _is.DatabaseSession session,
    CommunityReply row, {
    required _is.ColumnSelections<CommunityReplyTable> conflictColumns,
    _is.ColumnSelections<CommunityReplyTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityReplyTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<CommunityReply>(
      row,
      conflictColumns: conflictColumns(CommunityReply.t),
      updateColumns: updateColumns?.call(CommunityReply.t),
      updateWhere: updateWhere?.call(CommunityReply.t),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityReply]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityReply>> update(
    _is.DatabaseSession session,
    List<CommunityReply> rows, {
    _is.ColumnSelections<CommunityReplyTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<CommunityReply>(
      rows,
      columns: columns?.call(CommunityReply.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [CommunityReply]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<CommunityReply> updateRow(
    _is.DatabaseSession session,
    CommunityReply row, {
    _is.ColumnSelections<CommunityReplyTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<CommunityReply>(
      row,
      columns: columns?.call(CommunityReply.t),
      transaction: transaction,
    );
  }

  /// Updates a single [CommunityReply] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<CommunityReply?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<CommunityReplyUpdateTable> columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<CommunityReply>(
      id,
      columnValues: columnValues(CommunityReply.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityReply]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityReply>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<CommunityReplyUpdateTable> columnValues,
    required _is.WhereExpressionBuilder<CommunityReplyTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<CommunityReply>(
      columnValues: columnValues(CommunityReply.t.updateTable),
      where: where(CommunityReply.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [CommunityReply]s in the list and returns the deleted rows.
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
  Future<List<CommunityReply>> delete(
    _is.DatabaseSession session,
    List<CommunityReply> rows, {
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<CommunityReply>(
      rows,
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [CommunityReply].
  Future<CommunityReply> deleteRow(
    _is.DatabaseSession session,
    CommunityReply row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<CommunityReply>(
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
  Future<List<CommunityReply>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityReplyTable> where,
    _is.OrderByBuilder<CommunityReplyTable>? orderBy,
    _is.OrderByListBuilder<CommunityReplyTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<CommunityReply>(
      where: where(CommunityReply.t),
      orderBy: orderBy?.call(CommunityReply.t),
      orderByList: orderByList?.call(CommunityReply.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityReplyTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<CommunityReply>(
      where: where?.call(CommunityReply.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [CommunityReply] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityReplyTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<CommunityReply>(
      where: where(CommunityReply.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
