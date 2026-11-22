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

/// A message in a meetup's live room. Deleted when the meetup ends.
abstract class CommunityLiveMessage
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  CommunityLiveMessage._({
    this.id,
    required this.threadId,
    required this.authorId,
    required this.text,
    required this.input,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory CommunityLiveMessage({
    int? id,
    required int threadId,
    required int authorId,
    required String text,
    required _iiihb1zv.CommunityInput input,
    DateTime? createdAt,
  }) = _CommunityLiveMessageImpl;

  factory CommunityLiveMessage.fromJson(
    Map<String, dynamic> jsonSerialization,
  ) {
    return CommunityLiveMessage(
      id: jsonSerialization['id'] as int?,
      threadId: jsonSerialization['threadId'] as int,
      authorId: jsonSerialization['authorId'] as int,
      text: jsonSerialization['text'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  static final t = CommunityLiveMessageTable();

  static const db = CommunityLiveMessageRepository._();

  @override
  int? id;

  int threadId;

  int authorId;

  String text;

  _iiihb1zv.CommunityInput input;

  DateTime createdAt;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [CommunityLiveMessage]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityLiveMessage copyWith({
    int? id,
    int? threadId,
    int? authorId,
    String? text,
    _iiihb1zv.CommunityInput? input,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityLiveMessage',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'text': text,
      'input': input.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityLiveMessage',
      if (id != null) 'id': id,
      'threadId': threadId,
      'authorId': authorId,
      'text': text,
      'input': input.toJson(),
      'createdAt': createdAt.toJson(),
    };
  }

  static CommunityLiveMessageInclude include() {
    return CommunityLiveMessageInclude._();
  }

  static CommunityLiveMessageIncludeList includeList({
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    CommunityLiveMessageInclude? include,
  }) {
    return CommunityLiveMessageIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityLiveMessageImpl extends CommunityLiveMessage {
  _CommunityLiveMessageImpl({
    int? id,
    required int threadId,
    required int authorId,
    required String text,
    required _iiihb1zv.CommunityInput input,
    DateTime? createdAt,
  }) : super._(
         id: id,
         threadId: threadId,
         authorId: authorId,
         text: text,
         input: input,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [CommunityLiveMessage]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityLiveMessage copyWith({
    Object? id = _Undefined,
    int? threadId,
    int? authorId,
    String? text,
    _iiihb1zv.CommunityInput? input,
    DateTime? createdAt,
  }) {
    return CommunityLiveMessage(
      id: id is int? ? id : this.id,
      threadId: threadId ?? this.threadId,
      authorId: authorId ?? this.authorId,
      text: text ?? this.text,
      input: input ?? this.input,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class CommunityLiveMessageUpdateTable
    extends _is.UpdateTable<CommunityLiveMessageTable> {
  CommunityLiveMessageUpdateTable(super.table);

  _is.ColumnValue<int, int> threadId(int value) => _is.ColumnValue(
    table.threadId,
    value,
  );

  _is.ColumnValue<int, int> authorId(int value) => _is.ColumnValue(
    table.authorId,
    value,
  );

  _is.ColumnValue<String, String> text(String value) => _is.ColumnValue(
    table.text,
    value,
  );

  _is.ColumnValue<_iiihb1zv.CommunityInput, _iiihb1zv.CommunityInput> input(
    _iiihb1zv.CommunityInput value,
  ) => _is.ColumnValue(
    table.input,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> createdAt(DateTime value) =>
      _is.ColumnValue(
        table.createdAt,
        value,
      );
}

class CommunityLiveMessageTable extends _is.Table<int?> {
  CommunityLiveMessageTable({super.tableRelation})
    : super(tableName: 'community_live_message') {
    updateTable = CommunityLiveMessageUpdateTable(this);
    threadId = _is.ColumnInt(
      'threadId',
      this,
    );
    authorId = _is.ColumnInt(
      'authorId',
      this,
    );
    text = _is.ColumnString(
      'text',
      this,
    );
    input = _is.ColumnEnum(
      'input',
      this,
      _is.EnumSerialization.byName,
    );
    createdAt = _is.ColumnDateTime(
      'createdAt',
      this,
      hasDefault: true,
    );
  }

  late final CommunityLiveMessageUpdateTable updateTable;

  late final _is.ColumnInt threadId;

  late final _is.ColumnInt authorId;

  late final _is.ColumnString text;

  late final _is.ColumnEnum<_iiihb1zv.CommunityInput> input;

  late final _is.ColumnDateTime createdAt;

  @override
  List<_is.Column> get columns => [
    id,
    threadId,
    authorId,
    text,
    input,
    createdAt,
  ];
}

class CommunityLiveMessageInclude extends _is.IncludeObject {
  CommunityLiveMessageInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => CommunityLiveMessage.t;
}

class CommunityLiveMessageIncludeList extends _is.IncludeList {
  CommunityLiveMessageIncludeList._({
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(CommunityLiveMessage.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => CommunityLiveMessage.t;
}

class CommunityLiveMessageRepository {
  const CommunityLiveMessageRepository._();

  /// Returns a list of [CommunityLiveMessage]s matching the given query parameters.
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
  Future<List<CommunityLiveMessage>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<CommunityLiveMessage>(
      where: where?.call(CommunityLiveMessage.t),
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [CommunityLiveMessage]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `CommunityLiveMessage.t`.
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
  _ida.Stream<List<CommunityLiveMessage>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<CommunityLiveMessage>(
      where: where?.call(CommunityLiveMessage.t),
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [CommunityLiveMessage] matching the given query parameters.
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
  Future<CommunityLiveMessage?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? where,
    int? offset,
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<CommunityLiveMessage>(
      where: where?.call(CommunityLiveMessage.t),
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [CommunityLiveMessage] by its [id] or null if no such row exists.
  Future<CommunityLiveMessage?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<CommunityLiveMessage>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [CommunityLiveMessage]s in the list and returns the inserted rows.
  ///
  /// The returned [CommunityLiveMessage]s will have their `id` fields set.
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
  Future<List<CommunityLiveMessage>> insert(
    _is.DatabaseSession session,
    List<CommunityLiveMessage> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<CommunityLiveMessage>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [CommunityLiveMessage] and returns the inserted row.
  ///
  /// The returned [CommunityLiveMessage] will have its `id` field set.
  Future<CommunityLiveMessage> insertRow(
    _is.DatabaseSession session,
    CommunityLiveMessage row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<CommunityLiveMessage>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [CommunityLiveMessage]s in the list and returns the resulting rows.
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
  /// The returned [CommunityLiveMessage]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityLiveMessage>> upsert(
    _is.DatabaseSession session,
    List<CommunityLiveMessage> rows, {
    required _is.ColumnSelections<CommunityLiveMessageTable> conflictColumns,
    _is.ColumnSelections<CommunityLiveMessageTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<CommunityLiveMessage>(
      rows,
      conflictColumns: conflictColumns(CommunityLiveMessage.t),
      updateColumns: updateColumns?.call(CommunityLiveMessage.t),
      updateWhere: updateWhere?.call(CommunityLiveMessage.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [CommunityLiveMessage] and returns the resulting row.
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
  /// The returned [CommunityLiveMessage] will have its `id` field set.
  Future<CommunityLiveMessage?> upsertRow(
    _is.DatabaseSession session,
    CommunityLiveMessage row, {
    required _is.ColumnSelections<CommunityLiveMessageTable> conflictColumns,
    _is.ColumnSelections<CommunityLiveMessageTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<CommunityLiveMessage>(
      row,
      conflictColumns: conflictColumns(CommunityLiveMessage.t),
      updateColumns: updateColumns?.call(CommunityLiveMessage.t),
      updateWhere: updateWhere?.call(CommunityLiveMessage.t),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityLiveMessage]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityLiveMessage>> update(
    _is.DatabaseSession session,
    List<CommunityLiveMessage> rows, {
    _is.ColumnSelections<CommunityLiveMessageTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<CommunityLiveMessage>(
      rows,
      columns: columns?.call(CommunityLiveMessage.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [CommunityLiveMessage]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<CommunityLiveMessage> updateRow(
    _is.DatabaseSession session,
    CommunityLiveMessage row, {
    _is.ColumnSelections<CommunityLiveMessageTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<CommunityLiveMessage>(
      row,
      columns: columns?.call(CommunityLiveMessage.t),
      transaction: transaction,
    );
  }

  /// Updates a single [CommunityLiveMessage] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<CommunityLiveMessage?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<CommunityLiveMessageUpdateTable>
    columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<CommunityLiveMessage>(
      id,
      columnValues: columnValues(CommunityLiveMessage.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityLiveMessage]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityLiveMessage>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<CommunityLiveMessageUpdateTable>
    columnValues,
    required _is.WhereExpressionBuilder<CommunityLiveMessageTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<CommunityLiveMessage>(
      columnValues: columnValues(CommunityLiveMessage.t.updateTable),
      where: where(CommunityLiveMessage.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [CommunityLiveMessage]s in the list and returns the deleted rows.
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
  Future<List<CommunityLiveMessage>> delete(
    _is.DatabaseSession session,
    List<CommunityLiveMessage> rows, {
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<CommunityLiveMessage>(
      rows,
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [CommunityLiveMessage].
  Future<CommunityLiveMessage> deleteRow(
    _is.DatabaseSession session,
    CommunityLiveMessage row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<CommunityLiveMessage>(
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
  Future<List<CommunityLiveMessage>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityLiveMessageTable> where,
    _is.OrderByBuilder<CommunityLiveMessageTable>? orderBy,
    _is.OrderByListBuilder<CommunityLiveMessageTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<CommunityLiveMessage>(
      where: where(CommunityLiveMessage.t),
      orderBy: orderBy?.call(CommunityLiveMessage.t),
      orderByList: orderByList?.call(CommunityLiveMessage.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityLiveMessageTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<CommunityLiveMessage>(
      where: where?.call(CommunityLiveMessage.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [CommunityLiveMessage] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityLiveMessageTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<CommunityLiveMessage>(
      where: where(CommunityLiveMessage.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
