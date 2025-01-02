//see https://www.ibm.com/docs/en/epfz/6.1?topic=attributes-nondata#ndatts__vari

interface BaseTypeDescriptionProps {
    alignment: Alignment;
    scope: Scope;
    storage: StorageClass;
}
export interface BaseTypeDescription extends BaseTypeDescriptionProps {
    type: string;
}

type Alignment = 'aligned' | 'unaligned';
type Scope = 'internal' | 'external';
type StorageClass = 'automatic' | 'static' | 'based' | 'controlled';

/* TODO for storage attributes:
Defined
variable:
  DEFINED
  [POSITION]
 
Parameter:
PARAMETER
[CONNECTED |
NONCONNECTED]
[CONTROLLED]
 
[INITIAL
[CALL]]
 
[VARIABLE]
 
[NORMAL |
ABNORMAL]
 
ASSIGNABLE |
NONASSIGNABLE
*/

function createBaseTypeDescription(type: TypeDescriptionType, { alignment, scope, storage }: Partial<BaseTypeDescriptionProps>): BaseTypeDescriptionProps {
    if(!alignment) {
        if(type === PictureType || type === StringType) {
            alignment = 'unaligned';
        } else {
            alignment = 'aligned';
        }
    }

    scope ??= 'internal';

    if(!storage) {
        if(scope === 'internal') {
            storage = 'automatic';
        } else {
            storage = 'static';
        }
    }

    return {
        scope,
        storage,
        alignment
    };
}

//--- Area ---
const AreaType = 'area';
type AreaType = typeof AreaType;

interface AreaTypeDescriptionProps {
    size: number;
}


export interface AreaTypeDescription extends BaseTypeDescription, AreaTypeDescriptionProps {
    type: AreaType;
}

export function createAreaTypeDescription({ size, ...base }: AreaTypeDescriptionProps): AreaTypeDescription {
    return {
        type: AreaType,
        ...createBaseTypeDescription(AreaType, base),
        size
    };
}

export function isAreaTypeDescription(description: BaseTypeDescription): description is AreaTypeDescription {
    return description.type === AreaType;
}

//--- Arithmetic ---
const ArithmeticType = 'arithmetic';
type ArithmeticType = typeof ArithmeticType;

type NumberDomain = 'real' | 'complex';
type FractionMode = 'float' | 'fixed';
type BaseUnit = 'binary' | 'decimal';
type Precision = {
    totalCount: number;
    fractionalCount: number; //<= totalCount
};
type Sign = 'signed' | 'unsigned';

interface ArithmeticTypeDescriptionProps {
    domain: NumberDomain;
    fraction: FractionMode;
    unit: BaseUnit;
    precision: Precision;
    sign: Sign;
}


export interface ArithmeticTypeDescription extends BaseTypeDescription, ArithmeticTypeDescriptionProps {
    type: ArithmeticType;
}

export function createArithmeticTypeDescription({ domain = 'real', fraction = 'float', unit = 'decimal', precision, sign = 'signed', ...base }: ArithmeticTypeDescriptionProps) {
    return {
        type: ArithmeticType,
        ...createBaseTypeDescription(ArithmeticType, base),
        domain,
        fraction,
        unit,
        precision,
        sign
    };
}

export function isArithmeticTypeDescription(description: BaseTypeDescription): description is ArithmeticTypeDescription {
    return description.type === ArithmeticType;
}

//--- File ---
const FileType = "file";
type FileType = typeof FileType;

interface FileTypeDescriptionProps extends BaseTypeDescriptionProps {

}

export interface FileTypeDescription extends BaseTypeDescription, FileTypeDescriptionProps {
    type: FileType;
}

export function createFileTypeDescription({...base}: FileTypeDescriptionProps): FileTypeDescription {
    return {
        type: FileType,
        ...createBaseTypeDescription(FileType, base)
    };
}

export function isFileTypeDescription(description: BaseTypeDescription): description is FileTypeDescription {
    return description.type === FileType;
}

//--- Format ---
const FormatType = "format";
type FormatType = typeof FormatType;

interface FormatTypeDescriptionProps extends BaseTypeDescriptionProps {

}

export interface FormatTypeDescription extends BaseTypeDescription, FormatTypeDescriptionProps {
    type: FormatType;
}

export function createFormatTypeDescription({ ...base }: FormatTypeDescriptionProps): FormatTypeDescription {
    return {
        type: FormatType,
        ...createBaseTypeDescription(FormatType, base),
    };
}

export function isFormatTypeDescription(description: BaseTypeDescription): description is FormatTypeDescription {
    return description.type === FormatType;
}

//--- Label ---
const LabelType = "label";
type LabelType = typeof LabelType;

interface LabelTypeDescriptionProps extends BaseTypeDescriptionProps {

}


export interface LabelTypeDescription extends BaseTypeDescription, LabelTypeDescriptionProps {
    type: LabelType;
}

export function createLabelTypeDescription({ ...base }: LabelTypeDescriptionProps): LabelTypeDescription {
    return {
        type: LabelType,
        ...createBaseTypeDescription(LabelType, base),
    };
}

export function isLabelTypeDescription(description: BaseTypeDescription): description is LabelTypeDescription {
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

export interface LocatorTypeDescription extends BaseTypeDescription, LocatorTypeDescriptionProps {
    type: LocatorType;
}

export function createLocatorTypeDescription({ kind, ...base }: LocatorTypeDescriptionProps): LocatorTypeDescription {
    return {
        type: LocatorType,
        ...createBaseTypeDescription(LocatorType, base),
        kind
    };
}

export function isLocatorTypeDescription(description: BaseTypeDescription): description is LocatorTypeDescription {
    return description.type === LocatorType;
}

//--- Entry ---
const EntryType = "entry";
type EntryType = typeof EntryType;

interface EntryTypeDescriptionProps extends BaseTypeDescriptionProps {
}


export interface EntryTypeDescription extends BaseTypeDescription, EntryTypeDescriptionProps {
    type: EntryType;
}

export function createEntryTypeDescription({ ...base }: EntryTypeDescriptionProps): EntryTypeDescription {
    return {
        type: EntryType,
        ...createBaseTypeDescription(EntryType, base),
    };
}

export function isEntryTypeDescription(description: BaseTypeDescription): description is EntryTypeDescription {
    return description.type === EntryType;
}

//--- Ordinal ---
const OrdinalType = "ordinal";
type OrdinalType = typeof OrdinalType;

interface OrdinalTypeDescriptionProps extends BaseTypeDescriptionProps {
    names: string[];
}


export interface OrdinalTypeDescription extends BaseTypeDescription, OrdinalTypeDescriptionProps {
    type: OrdinalType;
}

export function createOrdinalTypeDescription({ names, ...base }: OrdinalTypeDescriptionProps): OrdinalTypeDescription {
    return {
        type: OrdinalType,
        ...createBaseTypeDescription(OrdinalType, base),
        names
    };
}

export function isOrdinalTypeDescription(description: BaseTypeDescription): description is OrdinalTypeDescription {
    return description.type === OrdinalType;
}

//--- Picture ---
const PictureType = "picture";
type PictureType = typeof PictureType;

type PictureWideness = 'picture' | 'widepic';

interface PictureTypeDescriptionProps extends BaseTypeDescriptionProps {
    kind: PictureWideness;
    domain: NumberDomain;
}


export interface PictureTypeDescription extends BaseTypeDescription, PictureTypeDescriptionProps {
    type: PictureType;
}

export function createPictureTypeDescription({ kind, domain = 'real', ...base }: PictureTypeDescriptionProps): PictureTypeDescription {
    return {
        type: PictureType,
        ...createBaseTypeDescription(PictureType, base),
        kind,
        domain
    };
}

export function isPictureTypeDescription(description: BaseTypeDescription): description is PictureTypeDescription {
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

export interface StringTypeDescription extends BaseTypeDescription, StringTypeDescriptionProps {
    type: StringType;
}

export function createStringTypeDescription({ kind, format, ...base }: StringTypeDescriptionProps): StringTypeDescription {
    return {
        type: StringType,
        ...createBaseTypeDescription(StringType, base),
        kind,
        format
    };
}

export function isStringTypeDescription(description: BaseTypeDescription): description is StringTypeDescription {
    return description.type === StringType;
}

//--- Task ---
const TaskType = "task";
type TaskType = typeof TaskType;

interface TaskTypeDescriptionProps extends BaseTypeDescriptionProps {

}

export interface TaskTypeDescription extends BaseTypeDescription, TaskTypeDescriptionProps {
    type: TaskType;
}

export function createTaskTypeDescription({ ...base }: TaskTypeDescriptionProps): TaskTypeDescription {
    return {
        type: TaskType,
        ...createBaseTypeDescription(TaskType, base),
    };
}

export function isTaskTypeDescription(description: BaseTypeDescription): description is TaskTypeDescription {
    return description.type === TaskType;
}

//--- all together ---
export type TypeDescription = 
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

export type TypeDescriptionType = TypeDescription['type'];

export namespace TypesDescriptions {
    //TODO
}