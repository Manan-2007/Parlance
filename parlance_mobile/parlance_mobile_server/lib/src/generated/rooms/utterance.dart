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
import '../rooms/member_role.dart' as _ivyg998y;
import '../rooms/utterance_kind.dart' as _i3ygd6vy;

/// Something said in a room: a signed word, speech, typed text or a card.
abstract class Utterance
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  Utterance._({
    this.id,
    required this.roomId,
    required this.memberId,
    required this.role,
    required this.kind,
    required this.text,
    this.hindi,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Utterance({
    int? id,
    required int roomId,
    required int memberId,
    required _ivyg998y.MemberRole role,
    required _i3ygd6vy.UtteranceKind kind,
    required String text,
    String? hindi,
    DateTime? createdAt,
  }) = _UtteranceImpl;

  factory Utterance.fromJson(Map<String, dynamic> jsonSerialization) {
    return Utterance(
      id: jsonSerialization['id'] as int?,
      roomId: jsonSerialization['roomId'] as int,
      memberId: jsonSerialization['memberId'] as int,
      role: _ivyg998y.MemberRole.fromJson(
        (jsonSerialization['role'] as String),
      ),
      kind: _i3ygd6vy.UtteranceKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      text: jsonSerialization['text'] as String,
      hindi: jsonSerialization['hindi'] as String?,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
    );
  }

  static final t = UtteranceTable();

  static const db = UtteranceRepository._();

  @override
  int? id;

  int roomId;

  int memberId;

  _ivyg998y.MemberRole role;

  _i3ygd6vy.UtteranceKind kind;

  String text;

  /// Hindi, when the message has one (cards and replies).
  String? hindi;

  DateTime createdAt;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [Utterance]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  Utterance copyWith({
    int? id,
    int? roomId,
    int? memberId,
    _ivyg998y.MemberRole? role,
    _i3ygd6vy.UtteranceKind? kind,
    String? text,
    String? hindi,
    DateTime? createdAt,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'Utterance',
      if (id != null) 'id': id,
      'roomId': roomId,
      'memberId': memberId,
      'role': role.toJson(),
      'kind': kind.toJson(),
      'text': text,
      if (hindi != null) 'hindi': hindi,
      'createdAt': createdAt.toJson(),
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'Utterance',
      if (id != null) 'id': id,
      'roomId': roomId,
      'memberId': memberId,
      'role': role.toJson(),
      'kind': kind.toJson(),
      'text': text,
      if (hindi != null) 'hindi': hindi,
      'createdAt': createdAt.toJson(),
    };
  }

  static UtteranceInclude include() {
    return UtteranceInclude._();
  }

  static UtteranceIncludeList includeList({
    _is.WhereExpressionBuilder<UtteranceTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    UtteranceInclude? include,
  }) {
    return UtteranceIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _UtteranceImpl extends Utterance {
  _UtteranceImpl({
    int? id,
    required int roomId,
    required int memberId,
    required _ivyg998y.MemberRole role,
    required _i3ygd6vy.UtteranceKind kind,
    required String text,
    String? hindi,
    DateTime? createdAt,
  }) : super._(
         id: id,
         roomId: roomId,
         memberId: memberId,
         role: role,
         kind: kind,
         text: text,
         hindi: hindi,
         createdAt: createdAt,
       );

  /// Returns a shallow copy of this [Utterance]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  Utterance copyWith({
    Object? id = _Undefined,
    int? roomId,
    int? memberId,
    _ivyg998y.MemberRole? role,
    _i3ygd6vy.UtteranceKind? kind,
    String? text,
    Object? hindi = _Undefined,
    DateTime? createdAt,
  }) {
    return Utterance(
      id: id is int? ? id : this.id,
      roomId: roomId ?? this.roomId,
      memberId: memberId ?? this.memberId,
      role: role ?? this.role,
      kind: kind ?? this.kind,
      text: text ?? this.text,
      hindi: hindi is String? ? hindi : this.hindi,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}

class UtteranceUpdateTable extends _is.UpdateTable<UtteranceTable> {
  UtteranceUpdateTable(super.table);

  _is.ColumnValue<int, int> roomId(int value) => _is.ColumnValue(
    table.roomId,
    value,
  );

  _is.ColumnValue<int, int> memberId(int value) => _is.ColumnValue(
    table.memberId,
    value,
  );

  _is.ColumnValue<_ivyg998y.MemberRole, _ivyg998y.MemberRole> role(
    _ivyg998y.MemberRole value,
  ) => _is.ColumnValue(
    table.role,
    value,
  );

  _is.ColumnValue<_i3ygd6vy.UtteranceKind, _i3ygd6vy.UtteranceKind> kind(
    _i3ygd6vy.UtteranceKind value,
  ) => _is.ColumnValue(
    table.kind,
    value,
  );

  _is.ColumnValue<String, String> text(String value) => _is.ColumnValue(
    table.text,
    value,
  );

  _is.ColumnValue<String, String> hindi(String? value) => _is.ColumnValue(
    table.hindi,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> createdAt(DateTime value) =>
      _is.ColumnValue(
        table.createdAt,
        value,
      );
}

class UtteranceTable extends _is.Table<int?> {
  UtteranceTable({super.tableRelation}) : super(tableName: 'utterance') {
    updateTable = UtteranceUpdateTable(this);
    roomId = _is.ColumnInt(
      'roomId',
      this,
    );
    memberId = _is.ColumnInt(
      'memberId',
      this,
    );
    role = _is.ColumnEnum(
      'role',
      this,
      _is.EnumSerialization.byName,
    );
    kind = _is.ColumnEnum(
      'kind',
      this,
      _is.EnumSerialization.byName,
    );
    text = _is.ColumnString(
      'text',
      this,
    );
    hindi = _is.ColumnString(
      'hindi',
      this,
    );
    createdAt = _is.ColumnDateTime(
      'createdAt',
      this,
      hasDefault: true,
    );
  }

  late final UtteranceUpdateTable updateTable;

  late final _is.ColumnInt roomId;

  late final _is.ColumnInt memberId;

  late final _is.ColumnEnum<_ivyg998y.MemberRole> role;

  late final _is.ColumnEnum<_i3ygd6vy.UtteranceKind> kind;

  late final _is.ColumnString text;

  /// Hindi, when the message has one (cards and replies).
  late final _is.ColumnString hindi;

  late final _is.ColumnDateTime createdAt;

  @override
  List<_is.Column> get columns => [
    id,
    roomId,
    memberId,
    role,
    kind,
    text,
    hindi,
    createdAt,
  ];
}

class UtteranceInclude extends _is.IncludeObject {
  UtteranceInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => Utterance.t;
}

class UtteranceIncludeList extends _is.IncludeList {
  UtteranceIncludeList._({
    _is.WhereExpressionBuilder<UtteranceTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(Utterance.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => Utterance.t;
}

class UtteranceRepository {
  const UtteranceRepository._();

  /// Returns a list of [Utterance]s matching the given query parameters.
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
  Future<List<Utterance>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<UtteranceTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<Utterance>(
      where: where?.call(Utterance.t),
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [Utterance]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `Utterance.t`.
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
  _ida.Stream<List<Utterance>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<UtteranceTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<Utterance>(
      where: where?.call(Utterance.t),
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [Utterance] matching the given query parameters.
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
  Future<Utterance?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<UtteranceTable>? where,
    int? offset,
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<Utterance>(
      where: where?.call(Utterance.t),
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [Utterance] by its [id] or null if no such row exists.
  Future<Utterance?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<Utterance>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [Utterance]s in the list and returns the inserted rows.
  ///
  /// The returned [Utterance]s will have their `id` fields set.
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
  Future<List<Utterance>> insert(
    _is.DatabaseSession session,
    List<Utterance> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<Utterance>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [Utterance] and returns the inserted row.
  ///
  /// The returned [Utterance] will have its `id` field set.
  Future<Utterance> insertRow(
    _is.DatabaseSession session,
    Utterance row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<Utterance>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [Utterance]s in the list and returns the resulting rows.
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
  /// The returned [Utterance]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<Utterance>> upsert(
    _is.DatabaseSession session,
    List<Utterance> rows, {
    required _is.ColumnSelections<UtteranceTable> conflictColumns,
    _is.ColumnSelections<UtteranceTable>? updateColumns,
    _is.WhereExpressionBuilder<UtteranceTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<Utterance>(
      rows,
      conflictColumns: conflictColumns(Utterance.t),
      updateColumns: updateColumns?.call(Utterance.t),
      updateWhere: updateWhere?.call(Utterance.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [Utterance] and returns the resulting row.
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
  /// The returned [Utterance] will have its `id` field set.
  Future<Utterance?> upsertRow(
    _is.DatabaseSession session,
    Utterance row, {
    required _is.ColumnSelections<UtteranceTable> conflictColumns,
    _is.ColumnSelections<UtteranceTable>? updateColumns,
    _is.WhereExpressionBuilder<UtteranceTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<Utterance>(
      row,
      conflictColumns: conflictColumns(Utterance.t),
      updateColumns: updateColumns?.call(Utterance.t),
      updateWhere: updateWhere?.call(Utterance.t),
      transaction: transaction,
    );
  }

  /// Updates all [Utterance]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<Utterance>> update(
    _is.DatabaseSession session,
    List<Utterance> rows, {
    _is.ColumnSelections<UtteranceTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<Utterance>(
      rows,
      columns: columns?.call(Utterance.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [Utterance]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<Utterance> updateRow(
    _is.DatabaseSession session,
    Utterance row, {
    _is.ColumnSelections<UtteranceTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<Utterance>(
      row,
      columns: columns?.call(Utterance.t),
      transaction: transaction,
    );
  }

  /// Updates a single [Utterance] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<Utterance?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<UtteranceUpdateTable> columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<Utterance>(
      id,
      columnValues: columnValues(Utterance.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [Utterance]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<Utterance>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<UtteranceUpdateTable> columnValues,
    required _is.WhereExpressionBuilder<UtteranceTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<Utterance>(
      columnValues: columnValues(Utterance.t.updateTable),
      where: where(Utterance.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [Utterance]s in the list and returns the deleted rows.
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
  Future<List<Utterance>> delete(
    _is.DatabaseSession session,
    List<Utterance> rows, {
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<Utterance>(
      rows,
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [Utterance].
  Future<Utterance> deleteRow(
    _is.DatabaseSession session,
    Utterance row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<Utterance>(
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
  Future<List<Utterance>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<UtteranceTable> where,
    _is.OrderByBuilder<UtteranceTable>? orderBy,
    _is.OrderByListBuilder<UtteranceTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<Utterance>(
      where: where(Utterance.t),
      orderBy: orderBy?.call(Utterance.t),
      orderByList: orderByList?.call(Utterance.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<UtteranceTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<Utterance>(
      where: where?.call(Utterance.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [Utterance] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<UtteranceTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<Utterance>(
      where: where(Utterance.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
