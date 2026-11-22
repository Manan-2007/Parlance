/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters
// ignore_for_file: invalid_use_of_internal_member
// ignore_for_file: dead_code, unnecessary_type_check

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:parlance_mobile_server/src/generated/community/community_post.dart'
    as _ik5n8esx;
import 'package:parlance_mobile_server/src/generated/community/community_space.dart'
    as _ivh75wso;
import 'package:parlance_mobile_server/src/generated/contribute/contribution_summary.dart'
    as _iurfaq06;
import 'package:parlance_mobile_server/src/generated/contribute/contribution_word.dart'
    as _i3lh744f;
import 'package:parlance_mobile_server/src/generated/contribute/review_item.dart'
    as _i4aaa37q;
import 'package:serverpod/protocol.dart' as _isp;
import 'package:serverpod/serverpod.dart' as _is;
import 'package:serverpod_auth_core_server/serverpod_auth_core_server.dart'
    as _iacs;
import 'package:serverpod_auth_idp_server/serverpod_auth_idp_server.dart'
    as _iais;
import 'community/community_author.dart' as _iegt1a7r;
import 'community/community_event.dart' as _ihb63zbz;
import 'community/community_event_kind.dart' as _ior3acp8;
import 'community/community_exception.dart' as _if5j8mqy;
import 'community/community_input.dart' as _i2t68c8j;
import 'community/community_kind.dart' as _ihuc1ngq;
import 'community/community_live_message.dart' as _i09av78f;
import 'community/community_live_message_view.dart' as _iru20fru;
import 'community/community_live_room.dart' as _i82ndp9n;
import 'community/community_mark.dart' as _i7vfxpt9;
import 'community/community_mark_kind.dart' as _iuqhq7xc;
import 'community/community_meetup.dart' as _ihmjr1od;
import 'community/community_member.dart' as _i5de81vi;
import 'community/community_post.dart' as _ikoxh2u0;
import 'community/community_reply.dart' as _id1r7uxk;
import 'community/community_reply_view.dart' as _igoe6lh9;
import 'community/community_space.dart' as _ixgpxqr0;
import 'community/community_target.dart' as _ik04a096;
import 'community/community_thread.dart' as _iq9mmxki;
import 'community/community_thread_detail.dart' as _intovxsm;
import 'config/app_settings.dart' as _i0thufz6;
import 'contribute/contribution_consent.dart' as _iy4ji0yu;
import 'contribute/contribution_exception.dart' as _iok7hr79;
import 'contribute/contribution_review.dart' as _itrup0tu;
import 'contribute/contribution_stats.dart' as _ihp33yuj;
import 'contribute/contribution_status.dart' as _iintrx5t;
import 'contribute/contribution_summary.dart' as _iojlpwtz;
import 'contribute/contribution_word.dart' as _igewqzt6;
import 'contribute/review_item.dart' as _ihwoh2je;
import 'contribute/review_verdict.dart' as _i1g5r5t1;
import 'contribute/sign_contribution.dart' as _i4c5c36l;
import 'greetings/greeting.dart' as _izw8z7ou;
import 'recognition/sign_frame.dart' as _igp1gr56;
import 'recognition/sign_result.dart' as _i7e9t1p9;
import 'recognition/sign_suggestion.dart' as _i64yj8ms;
import 'rooms/member_role.dart' as _iqfxuo8h;
import 'rooms/room.dart' as _ix383f3m;
import 'rooms/room_event.dart' as _i2zch034;
import 'rooms/room_event_kind.dart' as _imqsw82k;
import 'rooms/room_exception.dart' as _ivgvjqjf;
import 'rooms/room_info.dart' as _i8t1omy8;
import 'rooms/room_member.dart' as _izcbgdsw;
import 'rooms/utterance.dart' as _i0zwdlr4;
import 'rooms/utterance_kind.dart' as _i6sm9ai0;
export 'community/community_author.dart';
export 'community/community_event.dart';
export 'community/community_event_kind.dart';
export 'community/community_exception.dart';
export 'community/community_input.dart';
export 'community/community_kind.dart';
export 'community/community_live_message.dart';
export 'community/community_live_message_view.dart';
export 'community/community_live_room.dart';
export 'community/community_mark.dart';
export 'community/community_mark_kind.dart';
export 'community/community_meetup.dart';
export 'community/community_member.dart';
export 'community/community_post.dart';
export 'community/community_reply.dart';
export 'community/community_reply_view.dart';
export 'community/community_space.dart';
export 'community/community_target.dart';
export 'community/community_thread.dart';
export 'community/community_thread_detail.dart';
export 'config/app_settings.dart';
export 'contribute/contribution_consent.dart';
export 'contribute/contribution_exception.dart';
export 'contribute/contribution_review.dart';
export 'contribute/contribution_stats.dart';
export 'contribute/contribution_status.dart';
export 'contribute/contribution_summary.dart';
export 'contribute/contribution_word.dart';
export 'contribute/review_item.dart';
export 'contribute/review_verdict.dart';
export 'contribute/sign_contribution.dart';
export 'greetings/greeting.dart';
export 'recognition/sign_frame.dart';
export 'recognition/sign_result.dart';
export 'recognition/sign_suggestion.dart';
export 'rooms/member_role.dart';
export 'rooms/room.dart';
export 'rooms/room_event.dart';
export 'rooms/room_event_kind.dart';
export 'rooms/room_exception.dart';
export 'rooms/room_info.dart';
export 'rooms/room_member.dart';
export 'rooms/utterance.dart';
export 'rooms/utterance_kind.dart';

class Protocol extends _is.DatabaseSerializationManager
    implements _is.DatabaseProtocolDeserializationProvider {
  Protocol._();

  factory Protocol() => _instance;

  static final Protocol _instance = Protocol._().._registerHostProtocols();

  @override
  _is.ProtocolDeserialization get deserializationMetadata =>
      _is.ProtocolDeserialization.cached(
        this,
        types: const [
          _is.getType<_iegt1a7r.CommunityAuthor>,
          _is.getType<_ihb63zbz.CommunityEvent>,
          _is.getType<_ior3acp8.CommunityEventKind>,
          _is.getType<_if5j8mqy.CommunityException>,
          _is.getType<_i2t68c8j.CommunityInput>,
          _is.getType<_ihuc1ngq.CommunityKind>,
          _is.getType<_i09av78f.CommunityLiveMessage>,
          _is.getType<_iru20fru.CommunityLiveMessageView>,
          _is.getType<_i82ndp9n.CommunityLiveRoom>,
          _is.getType<_i7vfxpt9.CommunityMark>,
          _is.getType<_iuqhq7xc.CommunityMarkKind>,
          _is.getType<_ihmjr1od.CommunityMeetup>,
          _is.getType<_i5de81vi.CommunityMember>,
          _is.getType<_ikoxh2u0.CommunityPost>,
          _is.getType<_id1r7uxk.CommunityReply>,
          _is.getType<_igoe6lh9.CommunityReplyView>,
          _is.getType<_ixgpxqr0.CommunitySpace>,
          _is.getType<_ik04a096.CommunityTarget>,
          _is.getType<_iq9mmxki.CommunityThread>,
          _is.getType<_intovxsm.CommunityThreadDetail>,
          _is.getType<_i0thufz6.AppSettings>,
          _is.getType<_iy4ji0yu.ContributionConsent>,
          _is.getType<_iok7hr79.ContributionException>,
          _is.getType<_itrup0tu.ContributionReview>,
          _is.getType<_ihp33yuj.ContributionStats>,
          _is.getType<_iintrx5t.ContributionStatus>,
          _is.getType<_iojlpwtz.ContributionSummary>,
          _is.getType<_igewqzt6.ContributionWord>,
          _is.getType<_ihwoh2je.ReviewItem>,
          _is.getType<_i1g5r5t1.ReviewVerdict>,
          _is.getType<_i4c5c36l.SignContribution>,
          _is.getType<_izw8z7ou.Greeting>,
          _is.getType<_igp1gr56.SignFrame>,
          _is.getType<_i7e9t1p9.SignResult>,
          _is.getType<_i64yj8ms.SignSuggestion>,
          _is.getType<_iqfxuo8h.MemberRole>,
          _is.getType<_ix383f3m.Room>,
          _is.getType<_i2zch034.RoomEvent>,
          _is.getType<_imqsw82k.RoomEventKind>,
          _is.getType<_ivgvjqjf.RoomException>,
          _is.getType<_i8t1omy8.RoomInfo>,
          _is.getType<_izcbgdsw.RoomMember>,
          _is.getType<_i0zwdlr4.Utterance>,
          _is.getType<_i6sm9ai0.UtteranceKind>,
          _is.getType<_iegt1a7r.CommunityAuthor?>,
          _is.getType<_ihb63zbz.CommunityEvent?>,
          _is.getType<_ior3acp8.CommunityEventKind?>,
          _is.getType<_if5j8mqy.CommunityException?>,
          _is.getType<_i2t68c8j.CommunityInput?>,
          _is.getType<_ihuc1ngq.CommunityKind?>,
          _is.getType<_i09av78f.CommunityLiveMessage?>,
          _is.getType<_iru20fru.CommunityLiveMessageView?>,
          _is.getType<_i82ndp9n.CommunityLiveRoom?>,
          _is.getType<_i7vfxpt9.CommunityMark?>,
          _is.getType<_iuqhq7xc.CommunityMarkKind?>,
          _is.getType<_ihmjr1od.CommunityMeetup?>,
          _is.getType<_i5de81vi.CommunityMember?>,
          _is.getType<_ikoxh2u0.CommunityPost?>,
          _is.getType<_id1r7uxk.CommunityReply?>,
          _is.getType<_igoe6lh9.CommunityReplyView?>,
          _is.getType<_ixgpxqr0.CommunitySpace?>,
          _is.getType<_ik04a096.CommunityTarget?>,
          _is.getType<_iq9mmxki.CommunityThread?>,
          _is.getType<_intovxsm.CommunityThreadDetail?>,
          _is.getType<_i0thufz6.AppSettings?>,
          _is.getType<_iy4ji0yu.ContributionConsent?>,
          _is.getType<_iok7hr79.ContributionException?>,
          _is.getType<_itrup0tu.ContributionReview?>,
          _is.getType<_ihp33yuj.ContributionStats?>,
          _is.getType<_iintrx5t.ContributionStatus?>,
          _is.getType<_iojlpwtz.ContributionSummary?>,
          _is.getType<_igewqzt6.ContributionWord?>,
          _is.getType<_ihwoh2je.ReviewItem?>,
          _is.getType<_i1g5r5t1.ReviewVerdict?>,
          _is.getType<_i4c5c36l.SignContribution?>,
          _is.getType<_izw8z7ou.Greeting?>,
          _is.getType<_igp1gr56.SignFrame?>,
          _is.getType<_i7e9t1p9.SignResult?>,
          _is.getType<_i64yj8ms.SignSuggestion?>,
          _is.getType<_iqfxuo8h.MemberRole?>,
          _is.getType<_ix383f3m.Room?>,
          _is.getType<_i2zch034.RoomEvent?>,
          _is.getType<_imqsw82k.RoomEventKind?>,
          _is.getType<_ivgvjqjf.RoomException?>,
          _is.getType<_i8t1omy8.RoomInfo?>,
          _is.getType<_izcbgdsw.RoomMember?>,
          _is.getType<_i0zwdlr4.Utterance?>,
          _is.getType<_i6sm9ai0.UtteranceKind?>,
          _is.getType<List<String>>,
          _is.getType<List<_iru20fru.CommunityLiveMessageView>>,
          _is.getType<List<_igoe6lh9.CommunityReplyView>>,
          _is.getType<List<double>>,
          _is.getType<List<double>?>,
          _is.getType<List<_i64yj8ms.SignSuggestion>>,
          _is.getType<List<_i64yj8ms.SignSuggestion>?>,
          _is.getType<List<String>?>,
          _is.getType<List<_izcbgdsw.RoomMember>>,
          _is.getType<List<_i0zwdlr4.Utterance>>,
          _is.getType<List<String>>,
          _is.getType<List<_ivh75wso.CommunitySpace>>,
          _is.getType<List<_ik5n8esx.CommunityPost>>,
          _is.getType<List<_i3lh744f.ContributionWord>>,
          _is.getType<List<double>>,
          _is.getType<List<_iurfaq06.ContributionSummary>>,
          _is.getType<List<_i4aaa37q.ReviewItem>>,
        ],
        modules: const [
          _iais.Protocol.new,
          _iacs.Protocol.new,
          _isp.Protocol.new,
        ],
        classNames: const [
          'CommunityAuthor',
          'CommunityEvent',
          'CommunityEventKind',
          'CommunityException',
          'CommunityInput',
          'CommunityKind',
          'CommunityLiveMessage',
          'CommunityLiveMessageView',
          'CommunityLiveRoom',
          'CommunityMark',
          'CommunityMarkKind',
          'CommunityMeetup',
          'CommunityMember',
          'CommunityPost',
          'CommunityReply',
          'CommunityReplyView',
          'CommunitySpace',
          'CommunityTarget',
          'CommunityThread',
          'CommunityThreadDetail',
          'AppSettings',
          'ContributionConsent',
          'ContributionException',
          'ContributionReview',
          'ContributionStats',
          'ContributionStatus',
          'ContributionSummary',
          'ContributionWord',
          'ReviewItem',
          'ReviewVerdict',
          'SignContribution',
          'Greeting',
          'SignFrame',
          'SignResult',
          'SignSuggestion',
          'MemberRole',
          'Room',
          'RoomEvent',
          'RoomEventKind',
          'RoomException',
          'RoomInfo',
          'RoomMember',
          'Utterance',
          'UtteranceKind',
        ],
      );

  static List<_isp.TableDefinition> get targetTableDefinitions => [
    ..._ownTableDefinitions,
    ..._iais.Protocol().getOwnTableDefinitions(),
    ..._iacs.Protocol().getOwnTableDefinitions(),
    ..._isp.Protocol.targetTableDefinitions,
  ];

  static List<_isp.TableDefinition> get _ownTableDefinitions => [
    _isp.TableDefinition(
      name: 'community_live_message',
      dartName: 'CommunityLiveMessage',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'threadId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'authorId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'text',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'input',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:CommunityInput',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'community_live_thread_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'threadId',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'community_mark',
      dartName: 'CommunityMark',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'memberId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'kind',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:CommunityMarkKind',
        ),
        _isp.ColumnDefinition(
          name: 'target',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:CommunityTarget',
        ),
        _isp.ColumnDefinition(
          name: 'targetId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'reason',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'community_mark_unique_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'memberId',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'kind',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'target',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'targetId',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
        _isp.IndexDefinition(
          indexName: 'community_mark_target_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'kind',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'target',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'targetId',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'community_member',
      dartName: 'CommunityMember',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'userId',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'handle',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'handleKey',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'city',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'ways',
          columnType: _isp.ColumnType.json,
          isNullable: false,
          dartType: 'List<String>',
        ),
        _isp.ColumnDefinition(
          name: 'sample',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
        _isp.ColumnDefinition(
          name: 'joinedAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'community_member_user_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'userId',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
        _isp.IndexDefinition(
          indexName: 'community_member_handle_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'handleKey',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'community_reply',
      dartName: 'CommunityReply',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'threadId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'authorId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'body',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'input',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:CommunityInput',
        ),
        _isp.ColumnDefinition(
          name: 'quoteId',
          columnType: _isp.ColumnType.bigint,
          isNullable: true,
          dartType: 'int?',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
        _isp.ColumnDefinition(
          name: 'editedAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: true,
          dartType: 'DateTime?',
        ),
        _isp.ColumnDefinition(
          name: 'hidden',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
        _isp.ColumnDefinition(
          name: 'deleted',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'community_reply_thread_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'threadId',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'createdAt',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'community_thread',
      dartName: 'CommunityThread',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'space',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'kind',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:CommunityKind',
        ),
        _isp.ColumnDefinition(
          name: 'title',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'body',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'input',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:CommunityInput',
        ),
        _isp.ColumnDefinition(
          name: 'authorId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
        _isp.ColumnDefinition(
          name: 'editedAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: true,
          dartType: 'DateTime?',
        ),
        _isp.ColumnDefinition(
          name: 'lastActivityAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
        _isp.ColumnDefinition(
          name: 'answerId',
          columnType: _isp.ColumnType.bigint,
          isNullable: true,
          dartType: 'int?',
        ),
        _isp.ColumnDefinition(
          name: 'hidden',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
        _isp.ColumnDefinition(
          name: 'deleted',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
        _isp.ColumnDefinition(
          name: 'place',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'city',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'startsAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: true,
          dartType: 'DateTime?',
        ),
        _isp.ColumnDefinition(
          name: 'endsAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: true,
          dartType: 'DateTime?',
        ),
        _isp.ColumnDefinition(
          name: 'liveCode',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'community_thread_space_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'space',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'lastActivityAt',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
        _isp.IndexDefinition(
          indexName: 'community_thread_live_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'liveCode',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'contribution_consent',
      dartName: 'ContributionConsent',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'userId',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'version',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'givenAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
        _isp.ColumnDefinition(
          name: 'reviewer',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'contribution_consent_user_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'userId',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'contribution_review',
      dartName: 'ContributionReview',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'contributionId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'reviewerId',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'verdict',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:ReviewVerdict',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'contribution_review_unique_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'contributionId',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'reviewerId',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'room',
      dartName: 'Room',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'code',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'hostId',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
        _isp.ColumnDefinition(
          name: 'expiresAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
        ),
        _isp.ColumnDefinition(
          name: 'closed',
          columnType: _isp.ColumnType.boolean,
          isNullable: false,
          dartType: 'bool',
          columnDefault: 'false',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'room__code__unique_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'code',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'room_member',
      dartName: 'RoomMember',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'roomId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'userId',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'role',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:MemberRole',
        ),
        _isp.ColumnDefinition(
          name: 'name',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'joinedAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'room_member_unique',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'roomId',
            ),
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'userId',
            ),
          ],
          type: 'btree',
          isUnique: true,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'sign_contribution',
      dartName: 'SignContribution',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'userId',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'gloss',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'frames',
          columnType: _isp.ColumnType.json,
          isNullable: false,
          dartType: 'List<double>',
        ),
        _isp.ColumnDefinition(
          name: 'frameCount',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
        _isp.ColumnDefinition(
          name: 'status',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:ContributionStatus',
        ),
        _isp.ColumnDefinition(
          name: 'correctVotes',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
          columnDefault: '0',
        ),
        _isp.ColumnDefinition(
          name: 'wrongVotes',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
          columnDefault: '0',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'sign_contribution_user_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'userId',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
        _isp.IndexDefinition(
          indexName: 'sign_contribution_status_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'status',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
    _isp.TableDefinition(
      name: 'utterance',
      dartName: 'Utterance',
      schema: 'public',
      module: 'parlance_mobile',
      columns: [
        _isp.ColumnDefinition(
          name: 'id',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int?',
          columnDefault: 'serial',
        ),
        _isp.ColumnDefinition(
          name: 'roomId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'memberId',
          columnType: _isp.ColumnType.bigint,
          isNullable: false,
          dartType: 'int',
        ),
        _isp.ColumnDefinition(
          name: 'role',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:MemberRole',
        ),
        _isp.ColumnDefinition(
          name: 'kind',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'protocol:UtteranceKind',
        ),
        _isp.ColumnDefinition(
          name: 'text',
          columnType: _isp.ColumnType.text,
          isNullable: false,
          dartType: 'String',
        ),
        _isp.ColumnDefinition(
          name: 'hindi',
          columnType: _isp.ColumnType.text,
          isNullable: true,
          dartType: 'String?',
        ),
        _isp.ColumnDefinition(
          name: 'createdAt',
          columnType: _isp.ColumnType.timestampWithoutTimeZone,
          isNullable: false,
          dartType: 'DateTime',
          columnDefault: 'now',
        ),
      ],
      foreignKeys: [],
      indexes: [
        _isp.IndexDefinition(
          indexName: 'utterance_room_idx',
          tableSpace: null,
          elements: [
            _isp.IndexElementDefinition(
              type: _isp.IndexElementDefinitionType.column,
              definition: 'roomId',
            ),
          ],
          type: 'btree',
          isUnique: false,
          isPrimary: false,
        ),
      ],
      managed: true,
    ),
  ];

  static String? getClassNameFromObjectJson(dynamic data) =>
      _is.ProtocolDeserialization.readClassName(data);

  @override
  T deserialize<T>(
    dynamic data, [
    Type? t,
  ]) {
    t ??= T;
    final rawDataClassName = _is.ProtocolDeserialization.readClassName(data);
    final dataClassName = rawDataClassName;
    if (dataClassName != null && dataClassName != getClassNameForType(t)) {
      try {
        return deserializeByClassName({
          'className': dataClassName,
          'data': data,
        });
      } on _is.DeserializationClassNameNotFoundException catch (_) {
        // If the className is not recognized (e.g., older client receiving
        // data with a new subtype), fall back to deserializing without the
        // className, using the expected type T.
      }
    }

    if (t == _iegt1a7r.CommunityAuthor) {
      return _iegt1a7r.CommunityAuthor.fromJson(data) as T;
    }
    if (t == _ihb63zbz.CommunityEvent) {
      return _ihb63zbz.CommunityEvent.fromJson(data) as T;
    }
    if (t == _ior3acp8.CommunityEventKind) {
      return _ior3acp8.CommunityEventKind.fromJson(data) as T;
    }
    if (t == _if5j8mqy.CommunityException) {
      return _if5j8mqy.CommunityException.fromJson(data) as T;
    }
    if (t == _i2t68c8j.CommunityInput) {
      return _i2t68c8j.CommunityInput.fromJson(data) as T;
    }
    if (t == _ihuc1ngq.CommunityKind) {
      return _ihuc1ngq.CommunityKind.fromJson(data) as T;
    }
    if (t == _i09av78f.CommunityLiveMessage) {
      return _i09av78f.CommunityLiveMessage.fromJson(data) as T;
    }
    if (t == _iru20fru.CommunityLiveMessageView) {
      return _iru20fru.CommunityLiveMessageView.fromJson(data) as T;
    }
    if (t == _i82ndp9n.CommunityLiveRoom) {
      return _i82ndp9n.CommunityLiveRoom.fromJson(data) as T;
    }
    if (t == _i7vfxpt9.CommunityMark) {
      return _i7vfxpt9.CommunityMark.fromJson(data) as T;
    }
    if (t == _iuqhq7xc.CommunityMarkKind) {
      return _iuqhq7xc.CommunityMarkKind.fromJson(data) as T;
    }
    if (t == _ihmjr1od.CommunityMeetup) {
      return _ihmjr1od.CommunityMeetup.fromJson(data) as T;
    }
    if (t == _i5de81vi.CommunityMember) {
      return _i5de81vi.CommunityMember.fromJson(data) as T;
    }
    if (t == _ikoxh2u0.CommunityPost) {
      return _ikoxh2u0.CommunityPost.fromJson(data) as T;
    }
    if (t == _id1r7uxk.CommunityReply) {
      return _id1r7uxk.CommunityReply.fromJson(data) as T;
    }
    if (t == _igoe6lh9.CommunityReplyView) {
      return _igoe6lh9.CommunityReplyView.fromJson(data) as T;
    }
    if (t == _ixgpxqr0.CommunitySpace) {
      return _ixgpxqr0.CommunitySpace.fromJson(data) as T;
    }
    if (t == _ik04a096.CommunityTarget) {
      return _ik04a096.CommunityTarget.fromJson(data) as T;
    }
    if (t == _iq9mmxki.CommunityThread) {
      return _iq9mmxki.CommunityThread.fromJson(data) as T;
    }
    if (t == _intovxsm.CommunityThreadDetail) {
      return _intovxsm.CommunityThreadDetail.fromJson(data) as T;
    }
    if (t == _i0thufz6.AppSettings) {
      return _i0thufz6.AppSettings.fromJson(data) as T;
    }
    if (t == _iy4ji0yu.ContributionConsent) {
      return _iy4ji0yu.ContributionConsent.fromJson(data) as T;
    }
    if (t == _iok7hr79.ContributionException) {
      return _iok7hr79.ContributionException.fromJson(data) as T;
    }
    if (t == _itrup0tu.ContributionReview) {
      return _itrup0tu.ContributionReview.fromJson(data) as T;
    }
    if (t == _ihp33yuj.ContributionStats) {
      return _ihp33yuj.ContributionStats.fromJson(data) as T;
    }
    if (t == _iintrx5t.ContributionStatus) {
      return _iintrx5t.ContributionStatus.fromJson(data) as T;
    }
    if (t == _iojlpwtz.ContributionSummary) {
      return _iojlpwtz.ContributionSummary.fromJson(data) as T;
    }
    if (t == _igewqzt6.ContributionWord) {
      return _igewqzt6.ContributionWord.fromJson(data) as T;
    }
    if (t == _ihwoh2je.ReviewItem) {
      return _ihwoh2je.ReviewItem.fromJson(data) as T;
    }
    if (t == _i1g5r5t1.ReviewVerdict) {
      return _i1g5r5t1.ReviewVerdict.fromJson(data) as T;
    }
    if (t == _i4c5c36l.SignContribution) {
      return _i4c5c36l.SignContribution.fromJson(data) as T;
    }
    if (t == _izw8z7ou.Greeting) {
      return _izw8z7ou.Greeting.fromJson(data) as T;
    }
    if (t == _igp1gr56.SignFrame) {
      return _igp1gr56.SignFrame.fromJson(data) as T;
    }
    if (t == _i7e9t1p9.SignResult) {
      return _i7e9t1p9.SignResult.fromJson(data) as T;
    }
    if (t == _i64yj8ms.SignSuggestion) {
      return _i64yj8ms.SignSuggestion.fromJson(data) as T;
    }
    if (t == _iqfxuo8h.MemberRole) {
      return _iqfxuo8h.MemberRole.fromJson(data) as T;
    }
    if (t == _ix383f3m.Room) {
      return _ix383f3m.Room.fromJson(data) as T;
    }
    if (t == _i2zch034.RoomEvent) {
      return _i2zch034.RoomEvent.fromJson(data) as T;
    }
    if (t == _imqsw82k.RoomEventKind) {
      return _imqsw82k.RoomEventKind.fromJson(data) as T;
    }
    if (t == _ivgvjqjf.RoomException) {
      return _ivgvjqjf.RoomException.fromJson(data) as T;
    }
    if (t == _i8t1omy8.RoomInfo) {
      return _i8t1omy8.RoomInfo.fromJson(data) as T;
    }
    if (t == _izcbgdsw.RoomMember) {
      return _izcbgdsw.RoomMember.fromJson(data) as T;
    }
    if (t == _i0zwdlr4.Utterance) {
      return _i0zwdlr4.Utterance.fromJson(data) as T;
    }
    if (t == _i6sm9ai0.UtteranceKind) {
      return _i6sm9ai0.UtteranceKind.fromJson(data) as T;
    }
    if (t == _is.getType<_iegt1a7r.CommunityAuthor?>()) {
      return (data != null ? _iegt1a7r.CommunityAuthor.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ihb63zbz.CommunityEvent?>()) {
      return (data != null ? _ihb63zbz.CommunityEvent.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ior3acp8.CommunityEventKind?>()) {
      return (data != null ? _ior3acp8.CommunityEventKind.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_if5j8mqy.CommunityException?>()) {
      return (data != null ? _if5j8mqy.CommunityException.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_i2t68c8j.CommunityInput?>()) {
      return (data != null ? _i2t68c8j.CommunityInput.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ihuc1ngq.CommunityKind?>()) {
      return (data != null ? _ihuc1ngq.CommunityKind.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_i09av78f.CommunityLiveMessage?>()) {
      return (data != null
              ? _i09av78f.CommunityLiveMessage.fromJson(data)
              : null)
          as T;
    }
    if (t == _is.getType<_iru20fru.CommunityLiveMessageView?>()) {
      return (data != null
              ? _iru20fru.CommunityLiveMessageView.fromJson(data)
              : null)
          as T;
    }
    if (t == _is.getType<_i82ndp9n.CommunityLiveRoom?>()) {
      return (data != null ? _i82ndp9n.CommunityLiveRoom.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_i7vfxpt9.CommunityMark?>()) {
      return (data != null ? _i7vfxpt9.CommunityMark.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_iuqhq7xc.CommunityMarkKind?>()) {
      return (data != null ? _iuqhq7xc.CommunityMarkKind.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ihmjr1od.CommunityMeetup?>()) {
      return (data != null ? _ihmjr1od.CommunityMeetup.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_i5de81vi.CommunityMember?>()) {
      return (data != null ? _i5de81vi.CommunityMember.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ikoxh2u0.CommunityPost?>()) {
      return (data != null ? _ikoxh2u0.CommunityPost.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_id1r7uxk.CommunityReply?>()) {
      return (data != null ? _id1r7uxk.CommunityReply.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_igoe6lh9.CommunityReplyView?>()) {
      return (data != null ? _igoe6lh9.CommunityReplyView.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ixgpxqr0.CommunitySpace?>()) {
      return (data != null ? _ixgpxqr0.CommunitySpace.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ik04a096.CommunityTarget?>()) {
      return (data != null ? _ik04a096.CommunityTarget.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_iq9mmxki.CommunityThread?>()) {
      return (data != null ? _iq9mmxki.CommunityThread.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_intovxsm.CommunityThreadDetail?>()) {
      return (data != null
              ? _intovxsm.CommunityThreadDetail.fromJson(data)
              : null)
          as T;
    }
    if (t == _is.getType<_i0thufz6.AppSettings?>()) {
      return (data != null ? _i0thufz6.AppSettings.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_iy4ji0yu.ContributionConsent?>()) {
      return (data != null
              ? _iy4ji0yu.ContributionConsent.fromJson(data)
              : null)
          as T;
    }
    if (t == _is.getType<_iok7hr79.ContributionException?>()) {
      return (data != null
              ? _iok7hr79.ContributionException.fromJson(data)
              : null)
          as T;
    }
    if (t == _is.getType<_itrup0tu.ContributionReview?>()) {
      return (data != null ? _itrup0tu.ContributionReview.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ihp33yuj.ContributionStats?>()) {
      return (data != null ? _ihp33yuj.ContributionStats.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_iintrx5t.ContributionStatus?>()) {
      return (data != null ? _iintrx5t.ContributionStatus.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_iojlpwtz.ContributionSummary?>()) {
      return (data != null
              ? _iojlpwtz.ContributionSummary.fromJson(data)
              : null)
          as T;
    }
    if (t == _is.getType<_igewqzt6.ContributionWord?>()) {
      return (data != null ? _igewqzt6.ContributionWord.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ihwoh2je.ReviewItem?>()) {
      return (data != null ? _ihwoh2je.ReviewItem.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_i1g5r5t1.ReviewVerdict?>()) {
      return (data != null ? _i1g5r5t1.ReviewVerdict.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_i4c5c36l.SignContribution?>()) {
      return (data != null ? _i4c5c36l.SignContribution.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_izw8z7ou.Greeting?>()) {
      return (data != null ? _izw8z7ou.Greeting.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_igp1gr56.SignFrame?>()) {
      return (data != null ? _igp1gr56.SignFrame.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_i7e9t1p9.SignResult?>()) {
      return (data != null ? _i7e9t1p9.SignResult.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_i64yj8ms.SignSuggestion?>()) {
      return (data != null ? _i64yj8ms.SignSuggestion.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_iqfxuo8h.MemberRole?>()) {
      return (data != null ? _iqfxuo8h.MemberRole.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_ix383f3m.Room?>()) {
      return (data != null ? _ix383f3m.Room.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_i2zch034.RoomEvent?>()) {
      return (data != null ? _i2zch034.RoomEvent.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_imqsw82k.RoomEventKind?>()) {
      return (data != null ? _imqsw82k.RoomEventKind.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_ivgvjqjf.RoomException?>()) {
      return (data != null ? _ivgvjqjf.RoomException.fromJson(data) : null)
          as T;
    }
    if (t == _is.getType<_i8t1omy8.RoomInfo?>()) {
      return (data != null ? _i8t1omy8.RoomInfo.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_izcbgdsw.RoomMember?>()) {
      return (data != null ? _izcbgdsw.RoomMember.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_i0zwdlr4.Utterance?>()) {
      return (data != null ? _i0zwdlr4.Utterance.fromJson(data) : null) as T;
    }
    if (t == _is.getType<_i6sm9ai0.UtteranceKind?>()) {
      return (data != null ? _i6sm9ai0.UtteranceKind.fromJson(data) : null)
          as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == List<_iru20fru.CommunityLiveMessageView>) {
      return (data as List)
              .map((e) => deserialize<_iru20fru.CommunityLiveMessageView>(e))
              .toList()
          as T;
    }
    if (t == List<_igoe6lh9.CommunityReplyView>) {
      return (data as List)
              .map((e) => deserialize<_igoe6lh9.CommunityReplyView>(e))
              .toList()
          as T;
    }
    if (t == List<double>) {
      return (data as List).map((e) => deserialize<double>(e)).toList() as T;
    }
    if (t == _is.getType<List<double>?>()) {
      return (data != null
              ? (data as List).map((e) => deserialize<double>(e)).toList()
              : null)
          as T;
    }
    if (t == List<_i64yj8ms.SignSuggestion>) {
      return (data as List)
              .map((e) => deserialize<_i64yj8ms.SignSuggestion>(e))
              .toList()
          as T;
    }
    if (t == _is.getType<List<_i64yj8ms.SignSuggestion>?>()) {
      return (data != null
              ? (data as List)
                    .map((e) => deserialize<_i64yj8ms.SignSuggestion>(e))
                    .toList()
              : null)
          as T;
    }
    if (t == _is.getType<List<String>?>()) {
      return (data != null
              ? (data as List).map((e) => deserialize<String>(e)).toList()
              : null)
          as T;
    }
    if (t == List<_izcbgdsw.RoomMember>) {
      return (data as List)
              .map((e) => deserialize<_izcbgdsw.RoomMember>(e))
              .toList()
          as T;
    }
    if (t == List<_i0zwdlr4.Utterance>) {
      return (data as List)
              .map((e) => deserialize<_i0zwdlr4.Utterance>(e))
              .toList()
          as T;
    }
    if (t == List<String>) {
      return (data as List).map((e) => deserialize<String>(e)).toList() as T;
    }
    if (t == List<_ivh75wso.CommunitySpace>) {
      return (data as List)
              .map((e) => deserialize<_ivh75wso.CommunitySpace>(e))
              .toList()
          as T;
    }
    if (t == List<_ik5n8esx.CommunityPost>) {
      return (data as List)
              .map((e) => deserialize<_ik5n8esx.CommunityPost>(e))
              .toList()
          as T;
    }
    if (t == List<_i3lh744f.ContributionWord>) {
      return (data as List)
              .map((e) => deserialize<_i3lh744f.ContributionWord>(e))
              .toList()
          as T;
    }
    if (t == List<double>) {
      return (data as List).map((e) => deserialize<double>(e)).toList() as T;
    }
    if (t == List<_iurfaq06.ContributionSummary>) {
      return (data as List)
              .map((e) => deserialize<_iurfaq06.ContributionSummary>(e))
              .toList()
          as T;
    }
    if (t == List<_i4aaa37q.ReviewItem>) {
      return (data as List)
              .map((e) => deserialize<_i4aaa37q.ReviewItem>(e))
              .toList()
          as T;
    }
    final modules = deserializationMetadata.modulesForDeserialization(
      t,
      className: rawDataClassName,
    );
    for (final module in modules) {
      try {
        return module.deserialize<T>(data, t);
      } on _is.DeserializationTypeNotFoundException catch (_) {}
    }

    return super.deserialize<T>(data, t);
  }

  static String? getClassNameForType(Type type) {
    return switch (type) {
      _iegt1a7r.CommunityAuthor => 'CommunityAuthor',
      _ihb63zbz.CommunityEvent => 'CommunityEvent',
      _ior3acp8.CommunityEventKind => 'CommunityEventKind',
      _if5j8mqy.CommunityException => 'CommunityException',
      _i2t68c8j.CommunityInput => 'CommunityInput',
      _ihuc1ngq.CommunityKind => 'CommunityKind',
      _i09av78f.CommunityLiveMessage => 'CommunityLiveMessage',
      _iru20fru.CommunityLiveMessageView => 'CommunityLiveMessageView',
      _i82ndp9n.CommunityLiveRoom => 'CommunityLiveRoom',
      _i7vfxpt9.CommunityMark => 'CommunityMark',
      _iuqhq7xc.CommunityMarkKind => 'CommunityMarkKind',
      _ihmjr1od.CommunityMeetup => 'CommunityMeetup',
      _i5de81vi.CommunityMember => 'CommunityMember',
      _ikoxh2u0.CommunityPost => 'CommunityPost',
      _id1r7uxk.CommunityReply => 'CommunityReply',
      _igoe6lh9.CommunityReplyView => 'CommunityReplyView',
      _ixgpxqr0.CommunitySpace => 'CommunitySpace',
      _ik04a096.CommunityTarget => 'CommunityTarget',
      _iq9mmxki.CommunityThread => 'CommunityThread',
      _intovxsm.CommunityThreadDetail => 'CommunityThreadDetail',
      _i0thufz6.AppSettings => 'AppSettings',
      _iy4ji0yu.ContributionConsent => 'ContributionConsent',
      _iok7hr79.ContributionException => 'ContributionException',
      _itrup0tu.ContributionReview => 'ContributionReview',
      _ihp33yuj.ContributionStats => 'ContributionStats',
      _iintrx5t.ContributionStatus => 'ContributionStatus',
      _iojlpwtz.ContributionSummary => 'ContributionSummary',
      _igewqzt6.ContributionWord => 'ContributionWord',
      _ihwoh2je.ReviewItem => 'ReviewItem',
      _i1g5r5t1.ReviewVerdict => 'ReviewVerdict',
      _i4c5c36l.SignContribution => 'SignContribution',
      _izw8z7ou.Greeting => 'Greeting',
      _igp1gr56.SignFrame => 'SignFrame',
      _i7e9t1p9.SignResult => 'SignResult',
      _i64yj8ms.SignSuggestion => 'SignSuggestion',
      _iqfxuo8h.MemberRole => 'MemberRole',
      _ix383f3m.Room => 'Room',
      _i2zch034.RoomEvent => 'RoomEvent',
      _imqsw82k.RoomEventKind => 'RoomEventKind',
      _ivgvjqjf.RoomException => 'RoomException',
      _i8t1omy8.RoomInfo => 'RoomInfo',
      _izcbgdsw.RoomMember => 'RoomMember',
      _i0zwdlr4.Utterance => 'Utterance',
      _i6sm9ai0.UtteranceKind => 'UtteranceKind',
      _ => null,
    };
  }

  @override
  String? getClassNameForObject(Object? data) {
    String? className = super.getClassNameForObject(data);
    if (className != null) return className;

    if (data is Map<String, dynamic> && data['__className__'] is String) {
      return (data['__className__'] as String).replaceFirst(
        'parlance_mobile.',
        '',
      );
    }

    switch (data) {
      case _iegt1a7r.CommunityAuthor():
        return 'CommunityAuthor';
      case _ihb63zbz.CommunityEvent():
        return 'CommunityEvent';
      case _ior3acp8.CommunityEventKind():
        return 'CommunityEventKind';
      case _if5j8mqy.CommunityException():
        return 'CommunityException';
      case _i2t68c8j.CommunityInput():
        return 'CommunityInput';
      case _ihuc1ngq.CommunityKind():
        return 'CommunityKind';
      case _i09av78f.CommunityLiveMessage():
        return 'CommunityLiveMessage';
      case _iru20fru.CommunityLiveMessageView():
        return 'CommunityLiveMessageView';
      case _i82ndp9n.CommunityLiveRoom():
        return 'CommunityLiveRoom';
      case _i7vfxpt9.CommunityMark():
        return 'CommunityMark';
      case _iuqhq7xc.CommunityMarkKind():
        return 'CommunityMarkKind';
      case _ihmjr1od.CommunityMeetup():
        return 'CommunityMeetup';
      case _i5de81vi.CommunityMember():
        return 'CommunityMember';
      case _ikoxh2u0.CommunityPost():
        return 'CommunityPost';
      case _id1r7uxk.CommunityReply():
        return 'CommunityReply';
      case _igoe6lh9.CommunityReplyView():
        return 'CommunityReplyView';
      case _ixgpxqr0.CommunitySpace():
        return 'CommunitySpace';
      case _ik04a096.CommunityTarget():
        return 'CommunityTarget';
      case _iq9mmxki.CommunityThread():
        return 'CommunityThread';
      case _intovxsm.CommunityThreadDetail():
        return 'CommunityThreadDetail';
      case _i0thufz6.AppSettings():
        return 'AppSettings';
      case _iy4ji0yu.ContributionConsent():
        return 'ContributionConsent';
      case _iok7hr79.ContributionException():
        return 'ContributionException';
      case _itrup0tu.ContributionReview():
        return 'ContributionReview';
      case _ihp33yuj.ContributionStats():
        return 'ContributionStats';
      case _iintrx5t.ContributionStatus():
        return 'ContributionStatus';
      case _iojlpwtz.ContributionSummary():
        return 'ContributionSummary';
      case _igewqzt6.ContributionWord():
        return 'ContributionWord';
      case _ihwoh2je.ReviewItem():
        return 'ReviewItem';
      case _i1g5r5t1.ReviewVerdict():
        return 'ReviewVerdict';
      case _i4c5c36l.SignContribution():
        return 'SignContribution';
      case _izw8z7ou.Greeting():
        return 'Greeting';
      case _igp1gr56.SignFrame():
        return 'SignFrame';
      case _i7e9t1p9.SignResult():
        return 'SignResult';
      case _i64yj8ms.SignSuggestion():
        return 'SignSuggestion';
      case _iqfxuo8h.MemberRole():
        return 'MemberRole';
      case _ix383f3m.Room():
        return 'Room';
      case _i2zch034.RoomEvent():
        return 'RoomEvent';
      case _imqsw82k.RoomEventKind():
        return 'RoomEventKind';
      case _ivgvjqjf.RoomException():
        return 'RoomException';
      case _i8t1omy8.RoomInfo():
        return 'RoomInfo';
      case _izcbgdsw.RoomMember():
        return 'RoomMember';
      case _i0zwdlr4.Utterance():
        return 'Utterance';
      case _i6sm9ai0.UtteranceKind():
        return 'UtteranceKind';
    }
    className = _iais.Protocol().getClassNameForObject(data);
    if (className != null) {
      return className.contains('.')
          ? className
          : 'serverpod_auth_idp.$className';
    }
    className = _iacs.Protocol().getClassNameForObject(data);
    if (className != null) {
      return className.contains('.')
          ? className
          : 'serverpod_auth_core.$className';
    }
    className = _isp.Protocol().getClassNameForObject(data);
    if (className != null) {
      return className.contains('.') ? className : 'serverpod.$className';
    }
    return null;
  }

  @override
  dynamic deserializeByClassName(Map<String, dynamic> data) {
    var dataClassName = data['className'];
    if (dataClassName is! String) {
      return super.deserializeByClassName(data);
    }
    if (dataClassName == 'CommunityAuthor') {
      return deserialize<_iegt1a7r.CommunityAuthor>(data['data']);
    }
    if (dataClassName == 'CommunityEvent') {
      return deserialize<_ihb63zbz.CommunityEvent>(data['data']);
    }
    if (dataClassName == 'CommunityEventKind') {
      return deserialize<_ior3acp8.CommunityEventKind>(data['data']);
    }
    if (dataClassName == 'CommunityException') {
      return deserialize<_if5j8mqy.CommunityException>(data['data']);
    }
    if (dataClassName == 'CommunityInput') {
      return deserialize<_i2t68c8j.CommunityInput>(data['data']);
    }
    if (dataClassName == 'CommunityKind') {
      return deserialize<_ihuc1ngq.CommunityKind>(data['data']);
    }
    if (dataClassName == 'CommunityLiveMessage') {
      return deserialize<_i09av78f.CommunityLiveMessage>(data['data']);
    }
    if (dataClassName == 'CommunityLiveMessageView') {
      return deserialize<_iru20fru.CommunityLiveMessageView>(data['data']);
    }
    if (dataClassName == 'CommunityLiveRoom') {
      return deserialize<_i82ndp9n.CommunityLiveRoom>(data['data']);
    }
    if (dataClassName == 'CommunityMark') {
      return deserialize<_i7vfxpt9.CommunityMark>(data['data']);
    }
    if (dataClassName == 'CommunityMarkKind') {
      return deserialize<_iuqhq7xc.CommunityMarkKind>(data['data']);
    }
    if (dataClassName == 'CommunityMeetup') {
      return deserialize<_ihmjr1od.CommunityMeetup>(data['data']);
    }
    if (dataClassName == 'CommunityMember') {
      return deserialize<_i5de81vi.CommunityMember>(data['data']);
    }
    if (dataClassName == 'CommunityPost') {
      return deserialize<_ikoxh2u0.CommunityPost>(data['data']);
    }
    if (dataClassName == 'CommunityReply') {
      return deserialize<_id1r7uxk.CommunityReply>(data['data']);
    }
    if (dataClassName == 'CommunityReplyView') {
      return deserialize<_igoe6lh9.CommunityReplyView>(data['data']);
    }
    if (dataClassName == 'CommunitySpace') {
      return deserialize<_ixgpxqr0.CommunitySpace>(data['data']);
    }
    if (dataClassName == 'CommunityTarget') {
      return deserialize<_ik04a096.CommunityTarget>(data['data']);
    }
    if (dataClassName == 'CommunityThread') {
      return deserialize<_iq9mmxki.CommunityThread>(data['data']);
    }
    if (dataClassName == 'CommunityThreadDetail') {
      return deserialize<_intovxsm.CommunityThreadDetail>(data['data']);
    }
    if (dataClassName == 'AppSettings') {
      return deserialize<_i0thufz6.AppSettings>(data['data']);
    }
    if (dataClassName == 'ContributionConsent') {
      return deserialize<_iy4ji0yu.ContributionConsent>(data['data']);
    }
    if (dataClassName == 'ContributionException') {
      return deserialize<_iok7hr79.ContributionException>(data['data']);
    }
    if (dataClassName == 'ContributionReview') {
      return deserialize<_itrup0tu.ContributionReview>(data['data']);
    }
    if (dataClassName == 'ContributionStats') {
      return deserialize<_ihp33yuj.ContributionStats>(data['data']);
    }
    if (dataClassName == 'ContributionStatus') {
      return deserialize<_iintrx5t.ContributionStatus>(data['data']);
    }
    if (dataClassName == 'ContributionSummary') {
      return deserialize<_iojlpwtz.ContributionSummary>(data['data']);
    }
    if (dataClassName == 'ContributionWord') {
      return deserialize<_igewqzt6.ContributionWord>(data['data']);
    }
    if (dataClassName == 'ReviewItem') {
      return deserialize<_ihwoh2je.ReviewItem>(data['data']);
    }
    if (dataClassName == 'ReviewVerdict') {
      return deserialize<_i1g5r5t1.ReviewVerdict>(data['data']);
    }
    if (dataClassName == 'SignContribution') {
      return deserialize<_i4c5c36l.SignContribution>(data['data']);
    }
    if (dataClassName == 'Greeting') {
      return deserialize<_izw8z7ou.Greeting>(data['data']);
    }
    if (dataClassName == 'SignFrame') {
      return deserialize<_igp1gr56.SignFrame>(data['data']);
    }
    if (dataClassName == 'SignResult') {
      return deserialize<_i7e9t1p9.SignResult>(data['data']);
    }
    if (dataClassName == 'SignSuggestion') {
      return deserialize<_i64yj8ms.SignSuggestion>(data['data']);
    }
    if (dataClassName == 'MemberRole') {
      return deserialize<_iqfxuo8h.MemberRole>(data['data']);
    }
    if (dataClassName == 'Room') {
      return deserialize<_ix383f3m.Room>(data['data']);
    }
    if (dataClassName == 'RoomEvent') {
      return deserialize<_i2zch034.RoomEvent>(data['data']);
    }
    if (dataClassName == 'RoomEventKind') {
      return deserialize<_imqsw82k.RoomEventKind>(data['data']);
    }
    if (dataClassName == 'RoomException') {
      return deserialize<_ivgvjqjf.RoomException>(data['data']);
    }
    if (dataClassName == 'RoomInfo') {
      return deserialize<_i8t1omy8.RoomInfo>(data['data']);
    }
    if (dataClassName == 'RoomMember') {
      return deserialize<_izcbgdsw.RoomMember>(data['data']);
    }
    if (dataClassName == 'Utterance') {
      return deserialize<_i0zwdlr4.Utterance>(data['data']);
    }
    if (dataClassName == 'UtteranceKind') {
      return deserialize<_i6sm9ai0.UtteranceKind>(data['data']);
    }
    if (dataClassName.startsWith('serverpod_auth_idp.')) {
      return _iais.Protocol().deserializeByClassName({
        ...data,
        'className': dataClassName.substring(19),
      });
    }
    if (dataClassName.startsWith('serverpod_auth_core.')) {
      return _iacs.Protocol().deserializeByClassName({
        ...data,
        'className': dataClassName.substring(20),
      });
    }
    if (dataClassName.startsWith('serverpod.')) {
      return _isp.Protocol().deserializeByClassName({
        ...data,
        'className': dataClassName.substring(10),
      });
    }
    return super.deserializeByClassName(data);
  }

  void _registerHostProtocols() {
    _iais.Protocol().registerHostProtocol('parlance_mobile', this);
    _iacs.Protocol().registerHostProtocol('parlance_mobile', this);
  }

  @override
  _is.Table? getTableForType(Type t) {
    {
      var table = _iais.Protocol().getTableForType(t);
      if (table != null) {
        return table;
      }
    }
    {
      var table = _iacs.Protocol().getTableForType(t);
      if (table != null) {
        return table;
      }
    }
    {
      var table = _isp.Protocol().getTableForType(t);
      if (table != null) {
        return table;
      }
    }
    switch (t) {
      case _i09av78f.CommunityLiveMessage:
        return _i09av78f.CommunityLiveMessage.t;
      case _i7vfxpt9.CommunityMark:
        return _i7vfxpt9.CommunityMark.t;
      case _i5de81vi.CommunityMember:
        return _i5de81vi.CommunityMember.t;
      case _id1r7uxk.CommunityReply:
        return _id1r7uxk.CommunityReply.t;
      case _iq9mmxki.CommunityThread:
        return _iq9mmxki.CommunityThread.t;
      case _iy4ji0yu.ContributionConsent:
        return _iy4ji0yu.ContributionConsent.t;
      case _itrup0tu.ContributionReview:
        return _itrup0tu.ContributionReview.t;
      case _i4c5c36l.SignContribution:
        return _i4c5c36l.SignContribution.t;
      case _ix383f3m.Room:
        return _ix383f3m.Room.t;
      case _izcbgdsw.RoomMember:
        return _izcbgdsw.RoomMember.t;
      case _i0zwdlr4.Utterance:
        return _i0zwdlr4.Utterance.t;
    }
    return null;
  }

  @override
  List<_isp.TableDefinition> getTargetTableDefinitions() =>
      targetTableDefinitions;

  @override
  List<_isp.TableDefinition> getOwnTableDefinitions() => _ownTableDefinitions;

  @override
  String getModuleName() => 'parlance_mobile';

  /// Maps any `Record`s known to this [Protocol] to their JSON representation
  ///
  /// Throws in case the record type is not known.
  ///
  /// This method will return `null` (only) for `null` inputs.
  Map<String, dynamic>? mapRecordToJson(Record? record) {
    if (record == null) {
      return null;
    }
    try {
      return _iais.Protocol().mapRecordToJson(record);
    } catch (_) {}
    try {
      return _iacs.Protocol().mapRecordToJson(record);
    } catch (_) {}
    throw Exception('Unsupported record type ${record.runtimeType}');
  }
}
