/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright Contributors to the Zowe Project.
 *
 */

grammar Pl1

entry PliProgram:
    (statements+=TopLevelStatement)*;

TopLevelStatement: Package | ProcedureStatement | Directives;

Directives: SkipDirective | PopDirective | PushDirective | LineDirective | NoteDirective | PageDirective | PrintDirective | IncludeDirective | NoPrintDirective | ProcessDirective | ProcincDirective;

// Defined on p. 90
Package:
    prefix=ConditionPrefix?
    name=FeatureID ':'
    'PACKAGE'
    exports=Exports? 
    reserves=Reserves? 
    options=Options? ';'
    statements+=PackageLevelStatements*
    end=EndStatement ';';

ConditionPrefix: ('(' items+=ConditionPrefixItem ')' ':')+;

ConditionPrefixItem: conditions+=Condition (',' conditions+=Condition)*;

Exports:
    'EXPORTS' '(' (all?='*' | (procedures+=FeatureID (',' procedures+=FeatureID)*)) ')';

Reserves: 'RESERVES' '(' (all?='*' | (variables+=FeatureID (',' variables+=FeatureID)*)) ')';

// TODO refine based on p. 126
Options: 'OPTIONS' '(' items+=OptionsItem (','? items+=OptionsItem)* ')';

OptionsItem: 
    SimpleOptionsItem |
    MainOptionsItem |
    CMPATOptionsItem |
    LinkageOptionsItem |
    NoMapOptionsItem;

LinkageOptionsItem: 'LINKAGE' '(' value=('CDECL' | 'OPTLINK' | 'STDCALL' | 'SYSTEM') ')';

CMPATOptionsItem: 'CMPAT' '(' value=('V1' | 'V2' | 'V3') ')';

MainOptionsItem: 'MAIN' (noExecOps?='NOEXECOPS')?;

NoMapOptionsItem: type=('NOMAP' | 'NOMAPIN' | 'NOMAPOUT') ('(' (parameters+=FeatureID (',' parameters+=FeatureID)*)? ')')?;

SimpleOptionsItem: value=(
    // BEGIN/PACKAGE statement
    'ORDER' | 'REORDER' | 'NOCHARGRAPHIC' | 'CHARGRAPHIC' | 'NOINLINE' | 'INLINE' |
    // ENTRY declaration
    'COBOL' | 'FORTRAN' | 'BYADDR' | 'BYVALUE' | 'DESCRIPTOR' | 'NODESCRIPTOR' |
    'IRREDUCIBLE' | 'REDUCIBLE' | 'NORETURN' | 'REENTRANT' |
    // PACKAGE
    'FETCHABLE' | 'RENT' | 'AMODE31' | 'AMODE64' |
    // PROCEDURE statement
    'DLLINTERNAL' | 'FROMALIEN' | 'RETCODE' | 'ASSEMBLER' | /* abbr */ 'ASM' | 'WINMAIN' |
    // Undocumented (?)
    'INTER'
    );

PackageLevelStatements: DeclareStatement | DefineAliasStatement | DefineOrdinalStatement | DefineStructureStatement | DefaultStatement | ProcedureStatement;

ProcedureStatement: 
    (labels+=LabelPrefix)*
    ('PROC' | 'PROCEDURE' | xProc?='XPROC' | xProc?='XPROCEDURE') 
    ('(' (parameters+=ProcedureParameter (',' parameters+=ProcedureParameter)*)? ')')?
    returns=ReturnsOption?
    options=Options?
    recursive?='RECURSIVE'?
    (order=('ORDER' | 'REORDER'))?
    ('EXTERNAL' environmentName=FeatureID)?
    scope=ScopeAttribute? ';'
    statements+=ProcedureLevelStatement*
    ('PROC' | 'PROCEDURE')? end=EndStatement ';';


ScopeAttribute returns string: ('STATIC' | 'DYNAMIC');

LabelPrefix: name=FeatureID ':';

EntryStatement: 
    (labels+=LabelPrefix)*
    'ENTRY'
    ('(' (parameters+=ProcedureParameter (',' parameters+=ProcedureParameter)*)? ')')?
    ('EXTERNAL' environmentName=FeatureID)?
    returns=ReturnsOption?
    options=Options? ';';

ProcedureLevelStatement: Statement | Group | ProcedureStatement | BeginStatement;

// #region Statements

Statement: 
    condition=ConditionPrefix? (labels+=LabelPrefix)* value=Unit;

Unit: DeclareStatement | AllocateStatement | AssertStatement | AssignmentStatement | AttachStatement 
    | BeginStatement | CallStatement | CancelThreadStatement | CloseStatement | DefaultStatement | DefineAliasStatement | DefineOrdinalStatement | DefineStructureStatement
    | DelayStatement | DeleteStatement | DetachStatement | DisplayStatement | DoStatement
    | EntryStatement | ExecStatement | ExitStatement | FetchStatement | FlushStatement | FormatStatement
    | FreeStatement | GetStatement | GoToStatement
    | IfStatement | IncludeDirective | IterateStatement
    | LeaveStatement | LineDirective | LocateStatement
    | NoPrintDirective | NoteDirective | NullStatement
    | OnStatement | OpenStatement 
    | PageDirective | PopDirective | PrintDirective
    | ProcessDirective | ProcincDirective | PushDirective
    | PutStatement
    | QualifyStatement
    | ReadStatement | ReinitStatement | ReleaseStatement | ResignalStatement
    | ReturnStatement | RevertStatement | RewriteStatement
    | SelectStatement | SignalStatement | SkipDirective | StopStatement
    | WaitStatement | WriteStatement;

AllocateStatement: ('ALLOCATE' | 'ALLOC') variables+=AllocatedVariable (',' variables+=AllocatedVariable)* ';';

AllocatedVariable: level=DECIMAL_NUM? name=FeatureID attribute=AllocateAttribute?;

AllocateAttribute: AllocateDimension
    | AllocateType
    | AllocateLocationReference
    | InitialAttribute;

AllocateLocationReference: ('IN' '(' area=MemberCall ')' ('SET' '(' locatorVariable=MemberCall ')')? | 'SET' '(' locatorVariable=MemberCall ')');

AllocateDimension: dimensions=Dimensions;

AllocateType: type=AllocateAttributeType dimensions=Dimensions?;

AllocateAttributeType returns string: 'CHARACTER' | 'BIT' | 'GRAPHIC' | 'UCHAR' | 'WIDECHAR' | 'AREA';

AssertStatement: 'ASSERT' (
    true?='TRUE' '(' actual=Expression ')' 
    | false?='FALSE' '(' actual=Expression ')'
    | compare?='COMPARE' '(' actual=Expression ',' expected=Expression (',' operator=STRING_TERM)? ')'
    | unreachable?='UNREACHABLE'
    )
    ('TEXT' displayExpression=Expression)?;

AssignmentStatement: refs+=MemberCall (',' refs+=MemberCall)* operator=AssignmentOperator expression=Expression (',' 'BY' ('NAME' | 'DIMACROSS' dimacrossExpr=Expression))? ';';

AssignmentOperator returns string: '=' | '+=' | '-=' | '*=' | '/=' | '|=' | '&=' | '||=' | '**=' | '¬=' | '^=' | '<>';

AttachStatement: 'ATTACH' reference=MemberCall ('THREAD' '(' task=MemberCall ')') (environment?='ENVIRONMENT' '(' ('TSTACK' '(' tstack=Expression ')')? ')')? ';';

BeginStatement: 'BEGIN' options=Options? recursive?='RECURSIVE'? (order?='ORDER' | reorder?='REORDER')? ';'
    statements+=Statement*
    end=EndStatement ';';

EndStatement: (labels+=LabelPrefix)* 'END' label=FeatureID?;

CallStatement: 'CALL' reference=MemberCall ('(' (arguments+=('*' | Expression) (',' arguments+=('*' | Expression))*)? ')')? ';';

CancelThreadStatement: 'CANCEL' 'THREAD' '(' thread=MemberCall ')' ';';

CloseStatement: 'CLOSE' 'FILE' '(' (file=MemberCall | star?='*') ')' ';';

DefaultStatement: ('DEFAULT' | 'DFT') expressions+=DefaultExpression (',' expressions+=DefaultExpression)* ';';

DefaultExpression: expression=DefaultExpressionPart attributes+=DeclarationAttribute*;

DefaultExpressionPart: ('RANGE' '(' identifiers=DefaultRangeIdentifiers ')' | '(' expression=DefaultAttributeExpression ')');

DefaultRangeIdentifiers: (identifiers+=('*' | DefaultRangeIdentifierItem) (',' identifiers+=('*' | DefaultRangeIdentifierItem))*);

DefaultRangeIdentifierItem: from=FeatureID (':' to=FeatureID)?;

DefaultAttributeExpression: items+=DefaultAttributeExpressionNot ((operators+=('AND' | 'OR') items+=DefaultAttributeExpressionNot)*)?;

DefaultAttributeExpressionNot: (not?='NOT')? value=DefaultAttribute;

DefaultAttribute returns string:
    'ABNORMAL' | 'ALIGNED' | 'AREA' | 'ASSIGNABLE' | 'AUTOMATIC' 
    | 'BACKWARDS' | 'BASED' | 'BIT' | 'BUFFERED' | 'BUILTIN' | 'BYADDR' | 'BYVALUE' | 'BIN'
    | 'CHARACTER' | 'CHAR' | 'COMPLEX' | 'CONDITION' | 'CONNECTED' | 'CONSTANT' | 'CONTROLLED'
    | 'DECIMAL' | 'DEC' | 'DEFINED' | 'DIMENSION' 
    | 'ENTRY' | 'ENVIRONMENT' | 'ENV' | 'EVENT' | 'EXCLUSIVE' | 'EXTERNAL' | 'EXT'
    | 'FILE' | 'FIXED' | 'FLOAT' | 'FORMAT'
    | 'GENERIC' | 'GRAPHIC'
    | 'HEX' | 'HEXADEC'
    | 'IEEE' | 'INITIAL' | 'INIT' | 'INONLY' | 'INOUT' | 'INTERNAL' | 'INT' | 'IRREDUCIBLE' | 'INPUT'
    | 'KEYED'
    | 'LABEL' | 'LIST'
    | 'MEMBER'
    | 'NATIVE' | 'NONASSIGNABLE' | 'NONASGN' | 'NONCONNECTED' | 'NONNATIVE' | 'NONVARYING' | 'NORMAL'
    | 'OFFSET' | 'OPTIONAL' | 'OPTIONS' | 'OUTONLY' | 'OUTPUT'
    | 'PARAMETER' | 'PICTURE' | 'PIC' | 'POINTER' | 'PTR' | 'POSITION' | 'PRECISION' | 'PREC' | 'PRINT'
    | 'RANGE' | 'REAL' | 'RECORD' | 'RESERVED' | 'RETURNS'
    | 'SEQUENTIAL' | 'SIGNED' | 'STATIC' | 'STREAM' | 'STRUCTURE'
    | 'TASK' | 'TRANSIENT'
    | 'UNAL' | 'UCHAR' | 'UNALIGNED' | 'UNBUFFERED' | 'UNION' | 'UNSIGNED' | 'UPDATE'
    | 'VARIABLE' | 'VARYING' | 'VAR' | 'VARYING4' | 'VARYINGZ' | 'VARZ' | 'VALUE'
    | 'WIDECHAR' | 'WIDEPIC'
;

DefineAliasStatement: ('DEFINE' | xDefine?='XDEFINE') 'ALIAS' name=FeatureID (attributes+=DeclarationAttribute (',' attributes+=DeclarationAttribute)*)? ';';

DefineOrdinalStatement:
    ('DEFINE' | xDefine?='XDEFINE') 'ORDINAL' name=FQN
    '(' ordinalValues=OrdinalValueList ')' 
    (('PRECISION' | 'PREC') '(' precision=DECIMAL_NUM ')')? 
    (signed?='SIGNED' | unsigned?='UNSIGNED')?
    ';';

OrdinalValueList: members+=OrdinalValue (',' members+=OrdinalValue)*;

OrdinalValue: name=FeatureID ('VALUE'  '(' value=DECIMAL_NUM ')')?;

DefineStructureStatement: ('DEFINE' | xDefine?='XDEFINE') 'STRUCTURE' level=DECIMAL_NUM name=FQN (union?='UNION')? (',' substructures+=SubStructure)* ';';

SubStructure: level=DECIMAL_NUM name=FeatureID (attributes+=DeclarationAttribute (',' attributes+=DeclarationAttribute)*)?;

DelayStatement: 'DELAY' '(' delay=Expression ')' ';';

DeleteStatement: 'DELETE' 'FILE' '(' (file=MemberCall) ')' ('KEY' '(' key=Expression ')')? ';';

DetachStatement: 'DETACH' 'THREAD' '(' reference=MemberCall ')' ';';

DisplayStatement: 'DISPLAY' '(' expression=Expression ')' 
    ('REPLY' '(' reply=MemberCall ')')? 
    ('ROUTCDE' '(' rout+=DECIMAL_NUM (',' rout+=DECIMAL_NUM)* ')' ('DESC' '(' desc+=DECIMAL_NUM (',' desc+=DECIMAL_NUM)* ')')?)? ';'
;

DoStatement:
    'DO'
    // Note: DoType1 does nothing
    (DoType2 | DoType3)? ';'
        statements+=Statement*
    end=EndStatement ';';

DoType2: DoWhile | DoUntil;

DoWhile: 'WHILE' '(' while=Expression ')' ('UNTIL' '(' until=Expression ')')?;

DoUntil: 'UNTIL' '(' until=Expression ')' ('WHILE' '(' while=Expression ')')?;

DoType3: variable=DoType3Variable '=' specifications+=DoSpecification (',' specifications+=DoSpecification)*;

DoType3Variable: name=ID;

DoSpecification: exp1=Expression (
        'TO' to=Expression ('BY' by=Expression)?
        | 'BY' by=Expression ('TO' to=Expression)?
        | 'UPTHRU' upthru=Expression
        | 'DOWNTHRU' downthru=Expression
        | 'REPEAT' repeat=Expression
    )?
    whileOrUntil=(DoWhile | DoUntil)?;

ExecStatement: 'EXEC' query=ExecFragment ';';

ExitStatement: {infer ExitStatement} 'EXIT' ';';

FetchStatement: 'FETCH' entries+=FetchEntry (',' entries+=FetchEntry)* ';';

FetchEntry: name=FeatureID ('SET' '(' set=MemberCall ')')? ('TITLE' '(' title=Expression ')')?;

FlushStatement: 'FLUSH' 'FILE' '(' file=(MemberCall | '*') ')' ';';

FormatStatement: 'FORMAT' '(' list=FormatList ')' ';';

FormatList: items+=FormatListItem (',' items+=FormatListItem)*;

FormatListItem: level=Expression? (item=FormatItem | '(' list=FormatList ')');

FormatItem: RFormatItem | SkipFormatItem | VFormatItem | XFormatItem;

RFormatItem: 'R' '(' labelReference=FeatureID ')';

SkipFormatItem: 'SKIP' '(' skip=Expression ')';

VFormatItem: {infer VFormatItem} 'V';

XFormatItem: 'X' '(' width=Expression ')';

FreeStatement: 'FREE' references+=MemberCall (',' references+=MemberCall)* ';';

GetStatement: 'GET'
    ('FILE' '(' file=Expression ')')?
    (dataSpecification=DataSpecificationOptions)?
    (copy?='COPY' ('(' /* TODO REFERENCE */ copyReference=FeatureID ')')?)?
    (skip?='SKIP' ('(' skipExpression=Expression ')'))?
;

GoToStatement: ('GO' 'TO' | 'GOTO') /* TODO Reference to Label */ label=FeatureID ';';

IfStatement: 'IF' expression=Expression 'THEN' unit=Statement ('ELSE' else=Statement)?;

IncludeDirective: ('%INCLUDE' | '%XINCLUDE') items+=IncludeItem (',' items+=IncludeItem)* ';';

IncludeItem: file=(STRING_TERM|ID) | ddname?='ddname' '(' file=(STRING_TERM|ID) ')';

IterateStatement: 'ITERATE' /* TODO Reference to Label */ label=FeatureID? ';';

LeaveStatement: 'LEAVE' /* TODO Reference to Label */ label=FeatureID? ';';

LineDirective: '%LINE' ('(' line=DECIMAL_NUM ',' file=STRING_TERM ')') ';';

LocateStatement: 
    'LOCATE' variable=MemberCall 
    'FILE' '(' file=ReferenceItem ')' 
    ('SET' '(' set=MemberCall /* TODO Pointer-Reference? */ ')')? 
    ('KEYFROM' '(' keyfrom=Expression ')')?
    ';'
;

NoPrintDirective: {infer NoPrintDirective} '%NOPRINT' ';';

NoteDirective: '%NOTE' '(' message=Expression (',' code=Expression)? ')' ';';

NullStatement: {infer NullStatement} ';';

OnStatement: 'ON' conditions+=Condition (',' conditions+=Condition)* snap?='SNAP'? (system?='SYSTEM' ';' | onUnit=Statement);

Condition: KeywordCondition | NamedCondition | FileReferenceCondition;

KeywordCondition: keyword=(
    'ANYCONDITION' | 'ANYCOND' | 'AREA' | 'ASSERTION' | 'ATTENTION' 
    | 'CONFORMANCE' | 'CONVERSION'
    | 'ERROR'
    | 'FINISH'
    | 'FIXEDOVERFLOW' | 'FOFL'
    | 'INVALIDOP'
    | 'OVERFLOW' | 'OFL'
    | 'SIZE' | 'STORAGE' | 'STRINGRANGE' | 'STRINGSIZE' | 'SUBSCRIPTRANGE'
    | 'UNDERFLOW' | 'UFL'
    | 'ZERODIVIDE' | 'ZDIV'
);

NamedCondition: 'CONDITION' '(' name=FeatureID ')';

FileReferenceCondition: keyword=('ENDFILE' | 'ENDPAGE'| 'KEY'|'NAME'|'RECORD'|'TRANSMIT'|'UNDEFINEDFILE'|'UNDF') ('(' fileReference=ReferenceItem ')')?;

OpenStatement: 'OPEN' options+=OpenOptionsGroup (',' options+=OpenOptionsGroup)* ';';

OpenOptionsGroup:
    'FILE' '(' file=ReferenceItem ')'
    (stream?='STREAM' | record?='RECORD')?
    (input?='INPUT' | output?='OUTPUT' | update?='UPDATE')?
    ((sequential?='SEQUENTIAL' | direct?='DIRECT') (unbuffered?='UNBUFFERED' | buffered?='BUFFERED')?)?
    keyed?='KEYED'?
    print?='PRINT'?
    ('TITLE' '(' title=Expression ')')?
    ('LINESIZE' '(' lineSize=Expression ')')?
    ('PAGESIZE' '(' pageSize=Expression ')')?
;

PageDirective: {infer PageDirective} '%PAGE' ';';

PopDirective: {infer PopDirective} '%POP' ';';

PrintDirective: {infer PrintDirective} '%PRINT' ';';

ProcessDirective: ('*PROCESS' | '%PROCESS') (compilerOptions+=CompilerOptions (',' compilerOptions+=CompilerOptions))? ';';

CompilerOptions: value='TODO';

ProcincDirective: ('%PROCINC' | '*PROCINC') datasetName=FeatureID ';';

PushDirective: {infer PushDirective} '%PUSH' ';';

PutStatement: 'PUT' 
    (
        items+=PutItem* (dataSpecification=DataSpecificationOptions)?
        | ('STRING' '(' stringExpression=Expression ')' dataSpecification=DataSpecificationOptions)
    ) ';'
;

PutItem: attribute=PutAttribute ('(' expression=Expression ')')?;

PutAttribute returns string: 'PAGE' | 'LINE' | 'SKIP' | 'FILE';

DataSpecificationOptions: (
    ('LIST'? '(' dataList=DataSpecificationDataList ')')
    | data?='DATA' ('(' dataListItems+=DataSpecificationDataListItem (',' dataListItems+=DataSpecificationDataListItem)* ')')?
    | edit?='EDIT' ('(' dataLists+=DataSpecificationDataList ')' '(' formatLists+=DataSpecificationFormatList ')')+
);

DataSpecificationDataList: items+=(DataSpecificationDataListItem | DataSpecificationDataListItem3DO) (',' items+=(DataSpecificationDataListItem | DataSpecificationDataListItem3DO))*;

DataSpecificationDataListItem: values+=Expression (',' values+=Expression)*;

DataSpecificationDataListItem3DO: {infer DataSpecificationDataListItem3DO} 'TODO';

DataSpecificationFormatList: DataSpecificationDataListItem;

QualifyStatement: {infer QualifyStatement} 'QUALIFY' ';';

ReadStatement: 'READ' 'FILE' '(' fileReference=MemberCall ')' 
    (
        'IGNORE' '(' ignore=Expression ')' 
        | ('INTO' '(' intoRef=MemberCall ')' | 'SET' '(' set=MemberCall ')') ('KEY' '(' key=Expression ')' | 'KEYTO' '(' keyto=MemberCall ')')?
    )? ';'
;

ReinitStatement: 'REINIT' reference=MemberCall ';';

ReleaseStatement: 'RELEASE' (star?='*' | references+=FeatureID (',' references+=FeatureID)*) ';';

ResignalStatement: {infer ResignalStatement} 'RESIGNAL' ';';

ReturnStatement: 'RETURN' ('(' expression=Expression ')')? ';';

RevertStatement: 'REVER' conditions+=Condition (',' conditions+=Condition)* ';';

RewriteStatement: 'REWRITE' 'FILE' '(' file=MemberCall ')' ('FROM' '(' from=MemberCall ')')? ('KEY' '(' key=Expression ')')? ';';

// Ensure via validation that `Otherwise` appears last
SelectStatement: 
    'SELECT' '(' on=Expression ')' ';' 
    (statements+=(WhenStatement | OtherwiseStatement))* 
    end=EndStatement ';'
;

WhenStatement: 'WHEN' '(' conditions+=Expression (',' conditions+=Expression)* ')' unit=Statement /* maybe? ';' */;

OtherwiseStatement: ('OTHERWISE' | 'OTHER') unit=Statement /* maybe? ';' */;

SignalStatement: 'SIGNAL' condition+=Condition ';';

SkipDirective: '%SKIP' ('(' lines=Expression ')')? ';';

StopStatement: {infer StopStatement} 'STOP' ';';

WaitStatement: 'WAIT' 'THREAD' '(' task=MemberCall ')' ';';

WriteStatement: 'WRITE' 'FILE' '(' fileReference=MemberCall ')' 'FROM' '(' from=MemberCall ')' ('KEYFROM' '(' keyfrom=Expression ')' | 'KEYTO' '(' keyto=MemberCall ')')? ';';

// #endregion

InitialAttribute: (('INITIAL' | 'INIT') (
    direct?='(' items+=InitialAttributeItem (',' items+=InitialAttributeItem)* ')'
    | call?='CALL' reference=ID ('(' arguments+=Expression (',' arguments+=Expression)* ')')?
    | to?='TO' '(' content=InitialToContent ')' '(' items+=InitialAttributeItem (',' items+=InitialAttributeItem)* ')'
    )
    | across?='INITACROSS' '(' expressions+=InitAcrossExpression (',' expressions+=InitAcrossExpression)* ')'
    );

InitialToContent: (varying=Varying type=CharType | type=CharType varying=Varying?);

Varying returns string: 'VARYING' | 'VARYING4' | 'VARYINGZ' | 'NONVARYING';

CharType returns string: 'CHAR' | 'UCHAR' | 'WCHAR';

InitAcrossExpression: '(' expressions+=Expression (',' expressions+=Expression)* ')';

InitialAttributeItem: InitialAttributeItemStar | InitialAttributeConstant | InitialAttributeReference | InitialAttributeExpression | InitialAttributeSpecification;

InitialAttributeItemStar: {infer InitialAttributeItemStar} '*';
InitialAttributeConstant: constant=ConstantExpression;
InitialAttributeReference: reference=ID;
InitialAttributeExpression: '(' expression=Expression ')';
InitialAttributeSpecification: '(' star?='*' | expression=Expression ')' item=InitialAttributeSpecificationIteration;

InitialAttributeSpecificationIteration: InitialAttributeItemStar | InitialAttributeConstant | InitialAttributeReference | InitialAttributeSpecificationIterationValue;

InitialAttributeSpecificationIterationValue: '(' items+=InitialAttributeItem (',' items+=InitialAttributeItem)* ')';

Group: {infer Group} 'GROUP';

DeclareStatement: ('DCL' | 'DECLARE' | xDeclare?='XDECLARE' | xDeclare?='XDCL') items+=DeclaredItem (',' items+=DeclaredItem)*  ';';
DeclaredItem: level=DECIMAL_NUM? (elements+=DeclaredVariable | elements+='*' | '(' elements+=DeclaredVariable (',' elements+=DeclaredVariable)* ')') attributes+=DeclarationAttribute*;

type NamedElement = DeclaredVariable | ProcedureParameter | DoType3Variable;

DeclaredVariable: name=ID;

DeclarationAttribute: ComputationDataAttribute | DimensionsDataAttribute | EntryAttribute | LikeAttribute;

DimensionsDataAttribute: dimensions=Dimensions;

ComputationDataAttribute: type=DataAttributeType;

DataAttributeType returns string: DefaultAttribute;

LikeAttribute: 'LIKE' reference=MemberCall;

Dimensions: '(' (dimensions+=DimensionBound (',' dimensions+=DimensionBound)*)? ')';

DimensionBound: lower=Bound (':' upper=Bound)?;

Bound: (expression='*' | expression=Expression ('REFER' '(' refer=MemberCall ')')?);

EntryAttribute:
    'ENTRY'
    ('(' attributes+=EntryDescription (',' attributes+=EntryDescription)* ')')?
    options=Options?
    variable?='VARIABLE'?
    limited?='LIMITED'?
    returns=ReturnsOption?
    ('EXTERNAL' '(' environmentName=ID ')')?
;

ReturnsOption: 'RETURNS' '(' returnAttribute=DeclarationAttribute* ')';

EntryDescription: EntryParameterDescription | EntryUnionDescription;

EntryParameterDescription: (attributes+=DeclarationAttribute+ | '*' option=DefaultAttribute? optional?='OPTIONAL'?);

EntryUnionDescription: init=DECIMAL_NUM attributes+=DeclarationAttribute* optional?='OPTIONAL'? ',' prefixedAttributes+=PrefixedAttribute*;

PrefixedAttribute: level=DECIMAL_NUM attribute=DeclarationAttribute?;

ProcedureParameter: name=FeatureID;

ReferenceItem: ref=[NamedElement:FeatureID] dimensions=Dimensions?;

Expression: BitOrExpression;


// Note for expressions: Documentation uses '¬' to denote inversion or negation. The language actually uses '^'

// Priority 7
BitOrExpression infers Expression: BitAndExpression ({infer BitOrExpression.left=current} op=('|' | '¬' | '^') right=BitAndExpression)*;

// Priority 6
BitAndExpression infers Expression: CompExpression ({infer BitAndExpression.left=current} op='&' right=CompExpression)*;

// Priority 5
CompExpression infers Expression: ConcatExpression ({infer CompExpression.left=current} op=('<' | '¬<' | '<=' | '=' | '¬=' | '^=' | '<>' | '>=' | '>' | '¬>') right=ConcatExpression)*;

// Priority 4
ConcatExpression infers Expression: AddExpression ({infer ConcatExpression.left=current} op=('||' | '!!') right=AddExpression)*;

// Priority 3
AddExpression infers Expression: MultExpression ({infer AddExpression.left=current} op=('+' | '-' ) right=MultExpression)*;

// Priority 2
MultExpression infers Expression: ExpExpression ({infer MultExpression.left=current} op=('*' | '/' ) right=ExpExpression)*;

// Priority 1
ExpExpression infers Expression: PrimaryExpression ({infer ExpExpression.left=current} op='**' right=PrimaryExpression)*;

PrimaryExpression infers Expression: 
    '(' Expression ')'
    | UnaryExpression
    | ConstantExpression
    | MemberCall;

MemberCall:
    element=ReferenceItem
	({infer MemberCall.previous=current} 
        "." element=ReferenceItem
    )*;

UnaryExpression: op=('+' | '-' | '¬' | '^') expr=Expression;

ConstantExpression: Literal;

Literal: StringLiteral | BinaryLiteral | DecimalLiteral;

StringLiteral: ('(' multiplier=DECIMAL_NUM ')')? value=STRING_TERM;
BinaryLiteral: (negative?='-' | '+')? value=(BINARY_NUM | WRAPPED_NUM);
DecimalLiteral: (negative?='-' | '+')? value=DECIMAL_NUM;

FQN returns string: ID ('.' ID)*;
FeatureID returns string: ID;

hidden terminal WS: /\s+/;
terminal ExecFragment: /(?<=[eE][xX][eE][cC]\s+)[a-zA-Z]+\s[^;]*/;
terminal ID: /[@#_a-zA-Z][\w_@#]*/;
/**
 * Includes both fixed and non-fixed (with and without mantissa)
 */
terminal BINARY_NUM: FULL_NUM /([bB]|[iI])*/;
terminal WRAPPED_NUM:  ("'" (FULL_NUM | HEX_CHAR*) "'") /([xX][uU]|[xX][nN]|[bB]4|[bB]3|[bB][xX]|[bB]|[gG][xX]|[gG]|[uU][xX]|[wW][xX]|[xX]|[iI])*/;
terminal fragment HEX_CHAR: /[0-9a-fA-F]/;
terminal fragment NUM: /([0-9][0-9_]*(\.[0-9_]+)?)|(\.[0-9_]+)/;
terminal fragment FULL_NUM: NUM MANTISSA?;
terminal fragment MANTISSA: /[ESDQ][-+]?[0-9]+/;
terminal DECIMAL_NUM: FULL_NUM /[iI]?/;
terminal STRING_TERM: /("(""|\\.|[^"\\])*"|'(''|\\.|[^'\\])*')([xX]|[aA]|[eE])*/;

hidden terminal ML_COMMENT: /\/\*[\s\S]*?\*\//;
hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;