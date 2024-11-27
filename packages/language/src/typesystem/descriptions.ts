//see https://www.ibm.com/docs/en/epfz/6.1?topic=attributes-nondata#ndatts__vari

export interface BaseTypeDescription {
    type: string;
}

//--- Area ---
const AreaType = 'area';
type AreaAlignment = 'aligned' | 'unaligned';
interface AreaTypeDescriptionProps {
    aligment: AreaAlignment;
    size: number;
}

export interface AreaTypeDescription extends BaseTypeDescription, AreaTypeDescriptionProps {
    type: typeof AreaType;
}

export function createAreaTypeDescription({ size, aligment = 'aligned' }: AreaTypeDescriptionProps): AreaTypeDescription {
    return {
        type: AreaType,
        aligment,
        size
    };
}

export function isAreaTypeDescription(description: BaseTypeDescription): description is AreaTypeDescription {
    return description.type === AreaType;
}

//--- Arithmetic ---
const ArithmeticType = 'arithmetic';
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
    type: typeof ArithmeticType;
}

export function createArithmeticTypeDescription({ domain = 'real', fraction = 'float', unit = 'decimal', precision, sign = 'signed' }: ArithmeticTypeDescriptionProps) {
    return {
        type: ArithmeticType,
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

interface FileTypeDescriptionProps {

}

export interface FileTypeDescription extends BaseTypeDescription, FileTypeDescriptionProps {
    type: typeof FileType;
}

export function createFileTypeDescription({ }: FileTypeDescriptionProps): FileTypeDescription {
    return {
        type: FileType
    };
}

export function isFileTypeDescription(description: BaseTypeDescription): description is FileTypeDescription {
    return description.type === FileType;
}

//--- Format ---
const FormatType = "format";

interface FormatTypeDescriptionProps {

}

export interface FormatTypeDescription extends BaseTypeDescription, FormatTypeDescriptionProps {
    type: typeof FormatType;
}

export function createFormatTypeDescription({ }: FormatTypeDescriptionProps): FormatTypeDescription {
    return {
        type: FormatType
    };
}

export function isFormatTypeDescription(description: BaseTypeDescription): description is FormatTypeDescription {
    return description.type === FormatType;
}

//--- Label ---
const LabelType = "label";

interface LabelTypeDescriptionProps {

}

export interface LabelTypeDescription extends BaseTypeDescription, LabelTypeDescriptionProps {
    type: typeof LabelType;
}

export function createLabelTypeDescription({ }: LabelTypeDescriptionProps): LabelTypeDescription {
    return {
        type: LabelType
    };
}

export function isLabelTypeDescription(description: BaseTypeDescription): description is LabelTypeDescription {
    return description.type === LabelType;
}

//--- Locator ---
const LocatorType = "locator";
type LocatorKind = 'pointer' | 'handle' | 'offset';
//kind: pointer | handle(Type) | offset(area-variable LOCATES)

interface LocatorTypeDescriptionProps {
    kind: LocatorKind;
}

export interface LocatorTypeDescription extends BaseTypeDescription, LocatorTypeDescriptionProps {
    type: typeof LocatorType;
}

export function createLocatorTypeDescription({ kind }: LocatorTypeDescriptionProps): LocatorTypeDescription {
    return {
        type: LocatorType,
        kind
    };
}

export function isLocatorTypeDescription(description: BaseTypeDescription): description is LocatorTypeDescription {
    return description.type === LocatorType;
}

//--- Entry ---
const EntryType = "entry";

interface EntryTypeDescriptionProps {
}

export interface EntryTypeDescription extends BaseTypeDescription, EntryTypeDescriptionProps {
    type: typeof EntryType;
}

export function createEntryTypeDescription({ }: EntryTypeDescriptionProps): EntryTypeDescription {
    return {
        type: EntryType
    };
}

export function isEntryTypeDescription(description: BaseTypeDescription): description is EntryTypeDescription {
    return description.type === EntryType;
}

//--- Ordinal ---
const OrdinalType = "ordinal";

interface OrdinalTypeDescriptionProps {
    names: string[];
}

export interface OrdinalTypeDescription extends BaseTypeDescription, OrdinalTypeDescriptionProps {
    type: typeof OrdinalType;
}

export function createOrdinalTypeDescription({ names }: OrdinalTypeDescriptionProps): OrdinalTypeDescription {
    return {
        type: OrdinalType,
        names
    };
}

export function isOrdinalTypeDescription(description: BaseTypeDescription): description is OrdinalTypeDescription {
    return description.type === OrdinalType;
}

//--- Picture ---
const PictureType = "picture";

type PictureWideness = 'picture' | 'widepic';

interface PictureTypeDescriptionProps {
    kind: PictureWideness;
    domain: NumberDomain;
}

export interface PictureTypeDescription extends BaseTypeDescription, PictureTypeDescriptionProps {
    type: typeof PictureType;
}

export function createPictureTypeDescription({ kind, domain = 'real' }: PictureTypeDescriptionProps): PictureTypeDescription {
    return {
        type: PictureType,
        kind,
        domain
    };
}

export function isPictureTypeDescription(description: BaseTypeDescription): description is PictureTypeDescription {
    return description.type === PictureType;
}

//--- String ---
const StringType = "string";
type StringKind = 'bit' | 'character' | 'graphic' | 'uchar' | number /* widechar(length) */;
type StringFormat = 'varying' | 'varying4' | 'varyingz' | 'nonvarying';

interface StringTypeDescriptionProps {
    kind: StringKind;
    format: StringFormat;
}

export interface StringTypeDescription extends BaseTypeDescription, StringTypeDescriptionProps {
    type: typeof StringType;
}

export function createStringTypeDescription({ kind, format }: StringTypeDescriptionProps): StringTypeDescription {
    return {
        type: StringType,
        kind,
        format
    };
}

export function isStringTypeDescription(description: BaseTypeDescription): description is StringTypeDescription {
    return description.type === StringType;
}

//--- Task ---
const TaskType = "task";

interface TaskTypeDescriptionProps {

}

export interface TaskTypeDescription extends BaseTypeDescription, TaskTypeDescriptionProps {
    type: typeof TaskType;
}

export function createTaskTypeDescription({ }: TaskTypeDescriptionProps): TaskTypeDescription {
    return {
        type: TaskType
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