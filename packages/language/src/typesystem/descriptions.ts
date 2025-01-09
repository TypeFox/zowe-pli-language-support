/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=attributes-nondata#ndatts__vari */

interface BaseTypeDescriptionProps {
    alignment: Alignment;
    scope: Scope;
    storage: StorageClass;
    volatility: Volatility;
    position?: StoragePosition;
    assignability: Assignability;
    connection: StorageConnection;
    variable?: boolean;
}
interface BaseTypeDescription extends BaseTypeDescriptionProps {
    type: string;
}

/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=alignment-aligned-unaligned-attributes */
type Alignment = { type: 'aligned', alignment: 1|2|4|8 } | { type: 'unaligned' };
/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=declarations-internal-external-attributes */
type Scope = { type: 'internal' } | { type: 'external', environment: string };
/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=control-storage-classes-allocation-deallocation */
type StorageClass = 'automatic' | 'static' | 'based' | 'controlled';
/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=control-connected-nonconnected-attributes */
type StorageConnection = 'connected' | 'nonconnected';

/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=control-assignable-nonassignable-attributes */
type Assignability = 'assignable' | 'nonassignable';
/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=control-defined-position-attributes */
type StoragePosition = { //DEFINED variable [POSITION (position)]
    variable: null;//TODO set to "Variable" AstNode
    position: null;//TODO set to "Expression" AstNode
}

/** @see https://www.ibm.com/docs/en/epfz/6.1?topic=control-normal-abnormal-attributes */
type Volatility = 'normal' | 'abnormal';

/* TODO for storage attributes:
Parameter:
PARAMETER
[CONTROLLED]

@see https://www.ibm.com/docs/en/epfz/6.1?topic=control-initial-attribute
[INITIAL
[CALL]]
*/

function createBaseTypeDescription(type: TypeDescriptionType, { alignment, connection, scope, storage, volatility, position, assignability, variable }: Partial<BaseTypeDescriptionProps>): BaseTypeDescriptionProps {
    if(!alignment) {
        if(type === PictureType || type === StringType) {
            alignment = { type: 'unaligned' };
        } else {
            alignment = { type: 'aligned', alignment: 1 }; //TODO no documentation of default value for alignment
        }
    }

    if(variable !== undefined) {
        if(type !== EntryType && type !== FileType && type !== LabelType) {
            variable = undefined;
        }
    }

    assignability ??= 'assignable';
    connection ??= 'nonconnected';
    scope ??= { type: 'internal' };
    volatility ??= 'normal';

    if(!storage) {
        if(scope?.type === 'internal') {
            storage = 'automatic';
        } else {
            storage = 'static';
        }
    }

    return {
        alignment,
        assignability,
        connection,
        position,
        scope,
        storage,
        variable,
        volatility,
    };
}

//--- Area ---
const AreaType = 'area';
type AreaType = typeof AreaType;

interface AreaTypeDescriptionProps extends BaseTypeDescriptionProps {
    size: number;
}


interface AreaTypeDescription extends BaseTypeDescription, AreaTypeDescriptionProps {
    type: AreaType;
}

function createAreaTypeDescription({ size, ...base }: AreaTypeDescriptionProps): AreaTypeDescription {
    return {
        type: AreaType,
        ...createBaseTypeDescription(AreaType, base),
        size
    };
}

function isAreaTypeDescription(description: BaseTypeDescription): description is AreaTypeDescription {
    return description.type === AreaType;
}

//--- Arithmetic ---
const ArithmeticType = 'arithmetic';
type ArithmeticType = typeof ArithmeticType;

type NumberMode = 'real' | 'complex';
type ScaleMode = 'float' | 'fixed';
type Base = 'binary' | 'decimal';
type Precision = {
    totalCount: number;
    /** Attention: fractionalCount <= totalCount */
    fractionalCount: number; 
};
type Sign = 'signed' | 'unsigned';

interface ArithmeticTypeDescriptionProps {
    mode: NumberMode;
    scale: ScaleMode;
    base: Base;
    precision: Precision;
    sign: Sign;
}


interface ArithmeticTypeDescription extends BaseTypeDescription, ArithmeticTypeDescriptionProps {
    type: ArithmeticType;
}

function createArithmeticTypeDescription({ mode = 'real', scale = 'float', base: unit = 'decimal', precision, sign = 'signed', ...base }: ArithmeticTypeDescriptionProps): ArithmeticTypeDescription {
    return {
        type: ArithmeticType,
        ...createBaseTypeDescription(ArithmeticType, base),
        mode,
        scale,
        base: unit,
        precision,
        sign
    };
}

function isArithmeticTypeDescription(description: BaseTypeDescription): description is ArithmeticTypeDescription {
    return description.type === ArithmeticType;
}

//--- File ---
const FileType = "file";
type FileType = typeof FileType;

interface FileTypeDescriptionProps extends BaseTypeDescriptionProps {

}

interface FileTypeDescription extends BaseTypeDescription, FileTypeDescriptionProps {
    type: FileType;
}

function createFileTypeDescription({...base}: FileTypeDescriptionProps): FileTypeDescription {
    return {
        type: FileType,
        ...createBaseTypeDescription(FileType, base)
    };
}

function isFileTypeDescription(description: BaseTypeDescription): description is FileTypeDescription {
    return description.type === FileType;
}

//--- Format ---
const FormatType = "format";
type FormatType = typeof FormatType;

interface FormatTypeDescriptionProps extends BaseTypeDescriptionProps {

}

interface FormatTypeDescription extends BaseTypeDescription, FormatTypeDescriptionProps {
    type: FormatType;
}

function createFormatTypeDescription({ ...base }: FormatTypeDescriptionProps): FormatTypeDescription {
    return {
        type: FormatType,
        ...createBaseTypeDescription(FormatType, base),
    };
}

function isFormatTypeDescription(description: BaseTypeDescription): description is FormatTypeDescription {
    return description.type === FormatType;
}

//--- Label ---
const LabelType = "label";
type LabelType = typeof LabelType;

interface LabelTypeDescriptionProps extends BaseTypeDescriptionProps {

}


interface LabelTypeDescription extends BaseTypeDescription, LabelTypeDescriptionProps {
    type: LabelType;
}

function createLabelTypeDescription({ ...base }: LabelTypeDescriptionProps): LabelTypeDescription {
    return {
        type: LabelType,
        ...createBaseTypeDescription(LabelType, base),
    };
}

function isLabelTypeDescription(description: BaseTypeDescription): description is LabelTypeDescription {
    return description.type === LabelType;
}

//--- Locator ---
const LocatorType = "locator";
type LocatorType = typeof LocatorType;

type LocatorKind = 'pointer' | 'handle' | 'offset';
//kind: pointer | handle(Type) | offset(area-variable LOCATES)

interface LocatorTypeDescriptionProps extends BaseTypeDescriptionProps {
    kind: LocatorKind;
}

interface LocatorTypeDescription extends BaseTypeDescription, LocatorTypeDescriptionProps {
    type: LocatorType;
}

function createLocatorTypeDescription({ kind, ...base }: LocatorTypeDescriptionProps): LocatorTypeDescription {
    return {
        type: LocatorType,
        ...createBaseTypeDescription(LocatorType, base),
        kind
    };
}

function isLocatorTypeDescription(description: BaseTypeDescription): description is LocatorTypeDescription {
    return description.type === LocatorType;
}

//--- Entry ---
const EntryType = "entry";
type EntryType = typeof EntryType;

interface EntryTypeDescriptionProps extends BaseTypeDescriptionProps {
}


interface EntryTypeDescription extends BaseTypeDescription, EntryTypeDescriptionProps {
    type: EntryType;
}

function createEntryTypeDescription({ ...base }: EntryTypeDescriptionProps): EntryTypeDescription {
    return {
        type: EntryType,
        ...createBaseTypeDescription(EntryType, base),
    };
}

function isEntryTypeDescription(description: BaseTypeDescription): description is EntryTypeDescription {
    return description.type === EntryType;
}

//--- Ordinal ---
const OrdinalType = "ordinal";
type OrdinalType = typeof OrdinalType;

interface OrdinalTypeDescriptionProps extends BaseTypeDescriptionProps {
    names: string[];
}


interface OrdinalTypeDescription extends BaseTypeDescription, OrdinalTypeDescriptionProps {
    type: OrdinalType;
}

function createOrdinalTypeDescription({ names, ...base }: OrdinalTypeDescriptionProps): OrdinalTypeDescription {
    return {
        type: OrdinalType,
        ...createBaseTypeDescription(OrdinalType, base),
        names
    };
}

function isOrdinalTypeDescription(description: BaseTypeDescription): description is OrdinalTypeDescription {
    return description.type === OrdinalType;
}

//--- Picture ---
const PictureType = "picture";
type PictureType = typeof PictureType;

type PictureWideness = 'picture' | 'widepic';

interface PictureTypeDescriptionProps extends BaseTypeDescriptionProps {
    kind: PictureWideness;
    domain: NumberMode;
}


interface PictureTypeDescription extends BaseTypeDescription, PictureTypeDescriptionProps {
    type: PictureType;
}

function createPictureTypeDescription({ kind, domain = 'real', ...base }: PictureTypeDescriptionProps): PictureTypeDescription {
    return {
        type: PictureType,
        ...createBaseTypeDescription(PictureType, base),
        kind,
        domain
    };
}

function isPictureTypeDescription(description: BaseTypeDescription): description is PictureTypeDescription {
    return description.type === PictureType;
}

//--- String ---
const StringType = "string";
type StringType = typeof StringType;

type StringKind = 'bit' | 'character' | 'graphic' | 'uchar' | number /* widechar(length) */;
type StringFormat = 'varying' | 'varying4' | 'varyingz' | 'nonvarying';

interface StringTypeDescriptionProps extends BaseTypeDescriptionProps {
    kind: StringKind;
    format: StringFormat;
}

interface StringTypeDescription extends BaseTypeDescription, StringTypeDescriptionProps {
    type: StringType;
}

function createStringTypeDescription({ kind, format, ...base }: StringTypeDescriptionProps): StringTypeDescription {
    return {
        type: StringType,
        ...createBaseTypeDescription(StringType, base),
        kind,
        format
    };
}

function isStringTypeDescription(description: BaseTypeDescription): description is StringTypeDescription {
    return description.type === StringType;
}

//--- Task ---
const TaskType = "task";
type TaskType = typeof TaskType;

interface TaskTypeDescriptionProps extends BaseTypeDescriptionProps {

}

interface TaskTypeDescription extends BaseTypeDescription, TaskTypeDescriptionProps {
    type: TaskType;
}

function createTaskTypeDescription({ ...base }: TaskTypeDescriptionProps): TaskTypeDescription {
    return {
        type: TaskType,
        ...createBaseTypeDescription(TaskType, base),
    };
}

function isTaskTypeDescription(description: BaseTypeDescription): description is TaskTypeDescription {
    return description.type === TaskType;
}

//--- all together ---
type TypeDescription = 
    | AreaTypeDescription
    | ArithmeticTypeDescription
    | FileTypeDescription
    | FormatTypeDescription
    | LabelTypeDescription
    | LocatorTypeDescription
    | EntryTypeDescription
    | OrdinalTypeDescription
    | PictureTypeDescription
    | StringTypeDescription
    | TaskTypeDescription
    ;

type TypeDescriptionType = TypeDescription['type'];

export namespace TypesDescriptions {
    export type Any = TypeDescriptionType;

    export const Area = createAreaTypeDescription;
    export type Area = AreaTypeDescription;
    export const isArea = isAreaTypeDescription;

    export const Arithmetic = createArithmeticTypeDescription;
    export type Arithmetic = ArithmeticTypeDescription;
    export const isArithmetic = isArithmeticTypeDescription;

    export const File = createFileTypeDescription;
    export type File = FileTypeDescription;
    export const isFile = isFileTypeDescription;

    export const Format = createFormatTypeDescription;
    export type Format = FormatTypeDescription;
    export const isFormat = isFormatTypeDescription;

    export const Label = createLabelTypeDescription;
    export type Label = LabelTypeDescription;
    export const isLabel = isLabelTypeDescription;

    export const Locator = createLocatorTypeDescription;
    export type Locator = LocatorTypeDescription;
    export const isLocator = isLocatorTypeDescription;

    export const Entry = createEntryTypeDescription;
    export type Entry = EntryTypeDescription;
    export const isEntry = isEntryTypeDescription;

    export const Ordinal = createOrdinalTypeDescription;
    export type Ordinal = OrdinalTypeDescription;
    export const isOrdinal = isOrdinalTypeDescription;

    export const Picture = createPictureTypeDescription;
    export type Picture = PictureTypeDescription;
    export const isPicture = isPictureTypeDescription;

    export const String = createStringTypeDescription;
    export type String = StringTypeDescription;
    export const isString = isStringTypeDescription;

    export const Task = createTaskTypeDescription;
    export type Task = TaskTypeDescription;
    export const isTask = isTaskTypeDescription;
}