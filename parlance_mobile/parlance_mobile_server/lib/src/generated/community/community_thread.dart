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
import '../community/community_kind.dart' as _izt6ewmw;

/// A post that starts a conversation: a discussion, a question or a meetup.
abstract class CommunityThread
    implements _is.TableRow<int?>, _is.ProtocolSerialization {
  CommunityThread._({
    this.id,
    required this.space,
    required this.kind,
    required this.title,
    required this.body,
    required this.input,
    required this.authorId,
    DateTime? createdAt,
    this.editedAt,
    DateTime? lastActivityAt,
    this.answerId,
    bool? hidden,
    bool? deleted,
    this.place,
    this.city,
    this.startsAt,
    this.endsAt,
    this.liveCode,
  }) : createdAt = createdAt ?? DateTime.now(),
       lastActivityAt = lastActivityAt ?? DateTime.now(),
       hidden = hidden ?? false,
       deleted = deleted ?? false;

  factory CommunityThread({
    int? id,
    required String space,
    required _izt6ewmw.CommunityKind kind,
    required String title,
    required String body,
    required _iiihb1zv.CommunityInput input,
    required int authorId,
    DateTime? createdAt,
    DateTime? editedAt,
    DateTime? lastActivityAt,
    int? answerId,
    bool? hidden,
    bool? deleted,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
    String? liveCode,
  }) = _CommunityThreadImpl;

  factory CommunityThread.fromJson(Map<String, dynamic> jsonSerialization) {
    return CommunityThread(
      id: jsonSerialization['id'] as int?,
      space: jsonSerialization['space'] as String,
      kind: _izt6ewmw.CommunityKind.fromJson(
        (jsonSerialization['kind'] as String),
      ),
      title: jsonSerialization['title'] as String,
      body: jsonSerialization['body'] as String,
      input: _iiihb1zv.CommunityInput.fromJson(
        (jsonSerialization['input'] as String),
      ),
      authorId: jsonSerialization['authorId'] as int,
      createdAt: jsonSerialization['createdAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['createdAt']),
      editedAt: jsonSerialization['editedAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['editedAt']),
      lastActivityAt: jsonSerialization['lastActivityAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(
              jsonSerialization['lastActivityAt'],
            ),
      answerId: jsonSerialization['answerId'] as int?,
      hidden: jsonSerialization['hidden'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['hidden']),
      deleted: jsonSerialization['deleted'] == null
          ? null
          : _is.BoolJsonExtension.fromJson(jsonSerialization['deleted']),
      place: jsonSerialization['place'] as String?,
      city: jsonSerialization['city'] as String?,
      startsAt: jsonSerialization['startsAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['startsAt']),
      endsAt: jsonSerialization['endsAt'] == null
          ? null
          : _is.DateTimeJsonExtension.fromJson(jsonSerialization['endsAt']),
      liveCode: jsonSerialization['liveCode'] as String?,
    );
  }

  static final t = CommunityThreadTable();

  static const db = CommunityThreadRepository._();

  @override
  int? id;

  String space;

  _izt6ewmw.CommunityKind kind;

  String title;

  String body;

  _iiihb1zv.CommunityInput input;

  int authorId;

  DateTime createdAt;

  DateTime? editedAt;

  DateTime lastActivityAt;

  /// The reply the asker chose as the answer (questions only).
  int? answerId;

  /// Hidden after several people reported it.
  bool hidden;

  bool deleted;

  /// Meetups only.
  String? place;

  String? city;

  DateTime? startsAt;

  DateTime? endsAt;

  /// The live room's six-digit code, only shown to the host.
  String? liveCode;

  @override
  _is.Table<int?> get table => t;

  /// Returns a shallow copy of this [CommunityThread]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  CommunityThread copyWith({
    int? id,
    String? space,
    _izt6ewmw.CommunityKind? kind,
    String? title,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? authorId,
    DateTime? createdAt,
    DateTime? editedAt = const _is.$UndefinedDateTime(),
    DateTime? lastActivityAt,
    int? answerId,
    bool? hidden,
    bool? deleted,
    String? place,
    String? city,
    DateTime? startsAt = const _is.$UndefinedDateTime(),
    DateTime? endsAt = const _is.$UndefinedDateTime(),
    String? liveCode,
  });
  @override
  Map<String, dynamic> toJson() {
    return {
      '__className__': 'CommunityThread',
      if (id != null) 'id': id,
      'space': space,
      'kind': kind.toJson(),
      'title': title,
      'body': body,
      'input': input.toJson(),
      'authorId': authorId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'lastActivityAt': lastActivityAt.toJson(),
      if (answerId != null) 'answerId': answerId,
      'hidden': hidden,
      'deleted': deleted,
      if (place != null) 'place': place,
      if (city != null) 'city': city,
      if (startsAt != null) 'startsAt': startsAt?.toJson(),
      if (endsAt != null) 'endsAt': endsAt?.toJson(),
      if (liveCode != null) 'liveCode': liveCode,
    };
  }

  @override
  Map<String, dynamic> toJsonForProtocol() {
    return {
      '__className__': 'CommunityThread',
      if (id != null) 'id': id,
      'space': space,
      'kind': kind.toJson(),
      'title': title,
      'body': body,
      'input': input.toJson(),
      'authorId': authorId,
      'createdAt': createdAt.toJson(),
      if (editedAt != null) 'editedAt': editedAt?.toJson(),
      'lastActivityAt': lastActivityAt.toJson(),
      if (answerId != null) 'answerId': answerId,
      'hidden': hidden,
      'deleted': deleted,
      if (place != null) 'place': place,
      if (city != null) 'city': city,
      if (startsAt != null) 'startsAt': startsAt?.toJson(),
      if (endsAt != null) 'endsAt': endsAt?.toJson(),
    };
  }

  static CommunityThreadInclude include() {
    return CommunityThreadInclude._();
  }

  static CommunityThreadIncludeList includeList({
    _is.WhereExpressionBuilder<CommunityThreadTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    CommunityThreadInclude? include,
  }) {
    return CommunityThreadIncludeList._(
      where: where,
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      include: include,
    );
  }

  @override
  String toString() {
    return _is.SerializationManager.encode(this);
  }
}

class _Undefined {}

class _CommunityThreadImpl extends CommunityThread {
  _CommunityThreadImpl({
    int? id,
    required String space,
    required _izt6ewmw.CommunityKind kind,
    required String title,
    required String body,
    required _iiihb1zv.CommunityInput input,
    required int authorId,
    DateTime? createdAt,
    DateTime? editedAt,
    DateTime? lastActivityAt,
    int? answerId,
    bool? hidden,
    bool? deleted,
    String? place,
    String? city,
    DateTime? startsAt,
    DateTime? endsAt,
    String? liveCode,
  }) : super._(
         id: id,
         space: space,
         kind: kind,
         title: title,
         body: body,
         input: input,
         authorId: authorId,
         createdAt: createdAt,
         editedAt: editedAt,
         lastActivityAt: lastActivityAt,
         answerId: answerId,
         hidden: hidden,
         deleted: deleted,
         place: place,
         city: city,
         startsAt: startsAt,
         endsAt: endsAt,
         liveCode: liveCode,
       );

  /// Returns a shallow copy of this [CommunityThread]
  /// with some or all fields replaced by the given arguments.
  @_is.useResult
  @override
  CommunityThread copyWith({
    Object? id = _Undefined,
    String? space,
    _izt6ewmw.CommunityKind? kind,
    String? title,
    String? body,
    _iiihb1zv.CommunityInput? input,
    int? authorId,
    DateTime? createdAt,
    DateTime? editedAt = const _is.$UndefinedDateTime(),
    DateTime? lastActivityAt,
    Object? answerId = _Undefined,
    bool? hidden,
    bool? deleted,
    Object? place = _Undefined,
    Object? city = _Undefined,
    DateTime? startsAt = const _is.$UndefinedDateTime(),
    DateTime? endsAt = const _is.$UndefinedDateTime(),
    Object? liveCode = _Undefined,
  }) {
    return CommunityThread(
      id: id is int? ? id : this.id,
      space: space ?? this.space,
      kind: kind ?? this.kind,
      title: title ?? this.title,
      body: body ?? this.body,
      input: input ?? this.input,
      authorId: authorId ?? this.authorId,
      createdAt: createdAt ?? this.createdAt,
      editedAt: editedAt is _is.UndefinedSentinel ? this.editedAt : editedAt,
      lastActivityAt: lastActivityAt ?? this.lastActivityAt,
      answerId: answerId is int? ? answerId : this.answerId,
      hidden: hidden ?? this.hidden,
      deleted: deleted ?? this.deleted,
      place: place is String? ? place : this.place,
      city: city is String? ? city : this.city,
      startsAt: startsAt is _is.UndefinedSentinel ? this.startsAt : startsAt,
      endsAt: endsAt is _is.UndefinedSentinel ? this.endsAt : endsAt,
      liveCode: liveCode is String? ? liveCode : this.liveCode,
    );
  }
}

class CommunityThreadUpdateTable extends _is.UpdateTable<CommunityThreadTable> {
  CommunityThreadUpdateTable(super.table);

  _is.ColumnValue<String, String> space(String value) => _is.ColumnValue(
    table.space,
    value,
  );

  _is.ColumnValue<_izt6ewmw.CommunityKind, _izt6ewmw.CommunityKind> kind(
    _izt6ewmw.CommunityKind value,
  ) => _is.ColumnValue(
    table.kind,
    value,
  );

  _is.ColumnValue<String, String> title(String value) => _is.ColumnValue(
    table.title,
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

  _is.ColumnValue<int, int> authorId(int value) => _is.ColumnValue(
    table.authorId,
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

  _is.ColumnValue<DateTime, DateTime> lastActivityAt(DateTime value) =>
      _is.ColumnValue(
        table.lastActivityAt,
        value,
      );

  _is.ColumnValue<int, int> answerId(int? value) => _is.ColumnValue(
    table.answerId,
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

  _is.ColumnValue<String, String> place(String? value) => _is.ColumnValue(
    table.place,
    value,
  );

  _is.ColumnValue<String, String> city(String? value) => _is.ColumnValue(
    table.city,
    value,
  );

  _is.ColumnValue<DateTime, DateTime> startsAt(DateTime? value) =>
      _is.ColumnValue(
        table.startsAt,
        value,
      );

  _is.ColumnValue<DateTime, DateTime> endsAt(DateTime? value) =>
      _is.ColumnValue(
        table.endsAt,
        value,
      );

  _is.ColumnValue<String, String> liveCode(String? value) => _is.ColumnValue(
    table.liveCode,
    value,
  );
}

class CommunityThreadTable extends _is.Table<int?> {
  CommunityThreadTable({super.tableRelation})
    : super(tableName: 'community_thread') {
    updateTable = CommunityThreadUpdateTable(this);
    space = _is.ColumnString(
      'space',
      this,
    );
    kind = _is.ColumnEnum(
      'kind',
      this,
      _is.EnumSerialization.byName,
    );
    title = _is.ColumnString(
      'title',
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
    authorId = _is.ColumnInt(
      'authorId',
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
    lastActivityAt = _is.ColumnDateTime(
      'lastActivityAt',
      this,
      hasDefault: true,
    );
    answerId = _is.ColumnInt(
      'answerId',
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
    place = _is.ColumnString(
      'place',
      this,
    );
    city = _is.ColumnString(
      'city',
      this,
    );
    startsAt = _is.ColumnDateTime(
      'startsAt',
      this,
    );
    endsAt = _is.ColumnDateTime(
      'endsAt',
      this,
    );
    liveCode = _is.ColumnString(
      'liveCode',
      this,
    );
  }

  late final CommunityThreadUpdateTable updateTable;

  late final _is.ColumnString space;

  late final _is.ColumnEnum<_izt6ewmw.CommunityKind> kind;

  late final _is.ColumnString title;

  late final _is.ColumnString body;

  late final _is.ColumnEnum<_iiihb1zv.CommunityInput> input;

  late final _is.ColumnInt authorId;

  late final _is.ColumnDateTime createdAt;

  late final _is.ColumnDateTime editedAt;

  late final _is.ColumnDateTime lastActivityAt;

  /// The reply the asker chose as the answer (questions only).
  late final _is.ColumnInt answerId;

  /// Hidden after several people reported it.
  late final _is.ColumnBool hidden;

  late final _is.ColumnBool deleted;

  /// Meetups only.
  late final _is.ColumnString place;

  late final _is.ColumnString city;

  late final _is.ColumnDateTime startsAt;

  late final _is.ColumnDateTime endsAt;

  /// The live room's six-digit code, only shown to the host.
  late final _is.ColumnString liveCode;

  @override
  List<_is.Column> get columns => [
    id,
    space,
    kind,
    title,
    body,
    input,
    authorId,
    createdAt,
    editedAt,
    lastActivityAt,
    answerId,
    hidden,
    deleted,
    place,
    city,
    startsAt,
    endsAt,
    liveCode,
  ];
}

class CommunityThreadInclude extends _is.IncludeObject {
  CommunityThreadInclude._();

  @override
  Map<String, _is.Include?> get includes => {};

  @override
  _is.Table<int?> get table => CommunityThread.t;
}

class CommunityThreadIncludeList extends _is.IncludeList {
  CommunityThreadIncludeList._({
    _is.WhereExpressionBuilder<CommunityThreadTable>? where,
    super.limit,
    super.offset,
    super.orderBy,
    super.orderByList,
    super.include,
  }) {
    super.where = where?.call(CommunityThread.t);
  }

  @override
  Map<String, _is.Include?> get includes => include?.includes ?? {};

  @override
  _is.Table<int?> get table => CommunityThread.t;
}

class CommunityThreadRepository {
  const CommunityThreadRepository._();

  /// Returns a list of [CommunityThread]s matching the given query parameters.
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
  Future<List<CommunityThread>> find(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityThreadTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.find<CommunityThread>(
      where: where?.call(CommunityThread.t),
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      limit: limit,
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Emits [CommunityThread]s matching the given query parameters every time the
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
  /// to that set. Pass [Table] instances such as `CommunityThread.t`.
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
  _ida.Stream<List<CommunityThread>> watch(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityThreadTable>? where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    Duration? throttle = const Duration(milliseconds: 30),
    Iterable<_is.Table>? alsoTriggerOnTables,
  }) {
    return session.db.watch<CommunityThread>(
      where: where?.call(CommunityThread.t),
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      limit: limit,
      offset: offset,
      throttle: throttle,
      alsoTriggerOnTables: alsoTriggerOnTables,
    );
  }

  /// Returns the first matching [CommunityThread] matching the given query parameters.
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
  Future<CommunityThread?> findFirstRow(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityThreadTable>? where,
    int? offset,
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findFirstRow<CommunityThread>(
      where: where?.call(CommunityThread.t),
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      offset: offset,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Finds a single [CommunityThread] by its [id] or null if no such row exists.
  Future<CommunityThread?> findById(
    _is.DatabaseSession session,
    int id, {
    _is.Transaction? transaction,
    _is.LockMode? lockMode,
    _is.LockBehavior? lockBehavior,
  }) async {
    return session.db.findById<CommunityThread>(
      id,
      transaction: transaction,
      lockMode: lockMode,
      lockBehavior: lockBehavior,
    );
  }

  /// Inserts all [CommunityThread]s in the list and returns the inserted rows.
  ///
  /// The returned [CommunityThread]s will have their `id` fields set.
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
  Future<List<CommunityThread>> insert(
    _is.DatabaseSession session,
    List<CommunityThread> rows, {
    _is.Transaction? transaction,
    bool ignoreConflicts = false,
    bool noReturn = false,
  }) async {
    return session.db.insert<CommunityThread>(
      rows,
      transaction: transaction,
      ignoreConflicts: ignoreConflicts,
      noReturn: noReturn,
    );
  }

  /// Inserts a single [CommunityThread] and returns the inserted row.
  ///
  /// The returned [CommunityThread] will have its `id` field set.
  Future<CommunityThread> insertRow(
    _is.DatabaseSession session,
    CommunityThread row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.insertRow<CommunityThread>(
      row,
      transaction: transaction,
    );
  }

  /// Upserts all [CommunityThread]s in the list and returns the resulting rows.
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
  /// The returned [CommunityThread]s will have their `id` fields set.
  ///
  /// This is an atomic operation, meaning that if one of the rows fails,
  /// none of the rows will be affected.
  ///
  /// If [noReturn] is set to `true`, the resulting rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityThread>> upsert(
    _is.DatabaseSession session,
    List<CommunityThread> rows, {
    required _is.ColumnSelections<CommunityThreadTable> conflictColumns,
    _is.ColumnSelections<CommunityThreadTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityThreadTable>? updateWhere,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.upsert<CommunityThread>(
      rows,
      conflictColumns: conflictColumns(CommunityThread.t),
      updateColumns: updateColumns?.call(CommunityThread.t),
      updateWhere: updateWhere?.call(CommunityThread.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Upserts a single [CommunityThread] and returns the resulting row.
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
  /// The returned [CommunityThread] will have its `id` field set.
  Future<CommunityThread?> upsertRow(
    _is.DatabaseSession session,
    CommunityThread row, {
    required _is.ColumnSelections<CommunityThreadTable> conflictColumns,
    _is.ColumnSelections<CommunityThreadTable>? updateColumns,
    _is.WhereExpressionBuilder<CommunityThreadTable>? updateWhere,
    _is.Transaction? transaction,
  }) async {
    return session.db.upsertRow<CommunityThread>(
      row,
      conflictColumns: conflictColumns(CommunityThread.t),
      updateColumns: updateColumns?.call(CommunityThread.t),
      updateWhere: updateWhere?.call(CommunityThread.t),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityThread]s in the list and returns the updated rows. If
  /// [columns] is provided, only those columns will be updated. Defaults to
  /// all columns.
  /// This is an atomic operation, meaning that if one of the rows fails to
  /// update, none of the rows will be updated.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityThread>> update(
    _is.DatabaseSession session,
    List<CommunityThread> rows, {
    _is.ColumnSelections<CommunityThreadTable>? columns,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.update<CommunityThread>(
      rows,
      columns: columns?.call(CommunityThread.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Updates a single [CommunityThread]. The row needs to have its id set.
  /// Optionally, a list of [columns] can be provided to only update those
  /// columns. Defaults to all columns.
  Future<CommunityThread> updateRow(
    _is.DatabaseSession session,
    CommunityThread row, {
    _is.ColumnSelections<CommunityThreadTable>? columns,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateRow<CommunityThread>(
      row,
      columns: columns?.call(CommunityThread.t),
      transaction: transaction,
    );
  }

  /// Updates a single [CommunityThread] by its [id] with the specified [columnValues].
  /// Returns the updated row or null if no row with the given id exists.
  Future<CommunityThread?> updateById(
    _is.DatabaseSession session,
    int id, {
    required _is.ColumnValueListBuilder<CommunityThreadUpdateTable>
    columnValues,
    _is.Transaction? transaction,
  }) async {
    return session.db.updateById<CommunityThread>(
      id,
      columnValues: columnValues(CommunityThread.t.updateTable),
      transaction: transaction,
    );
  }

  /// Updates all [CommunityThread]s matching the [where] expression with the specified [columnValues].
  /// Returns the list of updated rows.
  ///
  /// If [noReturn] is set to `true`, the updated rows are not read back from
  /// the database and an empty list is returned. This avoids the overhead of
  /// transferring and deserializing the rows when the result is not needed.
  Future<List<CommunityThread>> updateWhere(
    _is.DatabaseSession session, {
    required _is.ColumnValueListBuilder<CommunityThreadUpdateTable>
    columnValues,
    required _is.WhereExpressionBuilder<CommunityThreadTable> where,
    int? limit,
    int? offset,
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.updateWhere<CommunityThread>(
      columnValues: columnValues(CommunityThread.t.updateTable),
      where: where(CommunityThread.t),
      limit: limit,
      offset: offset,
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes all [CommunityThread]s in the list and returns the deleted rows.
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
  Future<List<CommunityThread>> delete(
    _is.DatabaseSession session,
    List<CommunityThread> rows, {
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.delete<CommunityThread>(
      rows,
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Deletes a single [CommunityThread].
  Future<CommunityThread> deleteRow(
    _is.DatabaseSession session,
    CommunityThread row, {
    _is.Transaction? transaction,
  }) async {
    return session.db.deleteRow<CommunityThread>(
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
  Future<List<CommunityThread>> deleteWhere(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityThreadTable> where,
    _is.OrderByBuilder<CommunityThreadTable>? orderBy,
    _is.OrderByListBuilder<CommunityThreadTable>? orderByList,
    _is.Transaction? transaction,
    bool noReturn = false,
  }) async {
    return session.db.deleteWhere<CommunityThread>(
      where: where(CommunityThread.t),
      orderBy: orderBy?.call(CommunityThread.t),
      orderByList: orderByList?.call(CommunityThread.t),
      transaction: transaction,
      noReturn: noReturn,
    );
  }

  /// Counts the number of rows matching the [where] expression. If omitted,
  /// will return the count of all rows in the table.
  Future<int> count(
    _is.DatabaseSession session, {
    _is.WhereExpressionBuilder<CommunityThreadTable>? where,
    int? limit,
    _is.Transaction? transaction,
  }) async {
    return session.db.count<CommunityThread>(
      where: where?.call(CommunityThread.t),
      limit: limit,
      transaction: transaction,
    );
  }

  /// Acquires row-level locks on [CommunityThread] rows matching the [where] expression.
  Future<void> lockRows(
    _is.DatabaseSession session, {
    required _is.WhereExpressionBuilder<CommunityThreadTable> where,
    required _is.LockMode lockMode,
    required _is.Transaction transaction,
    _is.LockBehavior lockBehavior = _is.LockBehavior.wait,
  }) async {
    return session.db.lockRows<CommunityThread>(
      where: where(CommunityThread.t),
      lockMode: lockMode,
      lockBehavior: lockBehavior,
      transaction: transaction,
    );
  }
}
