declare module "node-c-struct" {
  class Type<T> {
    $value: T;
    readonly $buffer: ArrayBuffer;
    static times(length: number): ClassConstructor<BaseArrayType<T>>;
    readonly $arrayBuffer: ArrayBufferLike;
    static readonly byteSize: number;
    static readonly alignedSize: number;
    constructor(dataSize: number? = null, list: Uint8Array? = null);
  }

  type ClassConstructor<T> = new (...args: any[]) => T;

  class BaseType<T> extends Type<T> {}

  class BaseArrayType<T extends Type> {
    constructor(list = null);
    length(): number;
    [key: number]: T;
    static times(length: number): ClassConstructor<BaseArrayType<T>>;
    readonly $buffer: ArrayBuffer;
    readonly $arrayBuffer: ArrayBufferLike;
  }

  // bool
  class BoolType extends BaseType<boolean> {}

  // char
  class CharType extends BaseType<number> {}

  // uchar
  class UCharType extends BaseType<number> {}

  // short
  class ShortType extends BaseType<number> {}

  // ushort
  class UShortType extends BaseType<number> {}

  // int
  class IntType extends BaseType<number> {}

  // uint
  class UIntType extends BaseType<number> {}

  // long
  class LongType extends BaseType<number> {}

  // ulong
  class ULongType extends BaseType<number> {}

  // longlong
  class LongLongType extends BaseType<number> {}

  // ulonglong
  class ULongLongType extends BaseType<number> {}

  // float
  class FloatType extends BaseType<number> {}

  // double
  class DoubleType extends BaseType<number> {}

  // size_t
  class SizeType extends BaseType<number> {}

  // ssize_t
  class SSizeType extends BaseType<number> {}

  // int8_t
  class Int8Type extends BaseType<number> {}

  // uint8_t
  class UInt8Type extends BaseType<number> {}

  // int16_t
  class Int16Type extends BaseType<number> {}

  // uint16_t
  class UInt16Type extends BaseType<number> {}

  // int32_t
  class Int32Type extends BaseType<number> {}

  // uint32_t
  class UInt32Type extends BaseType<number> {}

  // int64_t
  class Int64Type extends BaseType<number> {}

  // uint64_t
  class UInt64Type extends BaseType<number> {}

  // struct
  class StructType<T> extends BaseType<T> {
    constructor(value: T? = undefined, options: { buffer: Uint8Array } = {});
  }

  // union
  class UnionType extends BaseType<any> {}

  export {
    BoolType,
    CharType,
    UCharType,
    ShortType,
    UShortType,
    IntType,
    UIntType,
    LongType,
    ULongType,
    LongLongType,
    ULongLongType,
    FloatType,
    DoubleType,
    SizeType,
    SSizeType,
    Int8Type,
    UInt8Type,
    Int16Type,
    UInt16Type,
    Int32Type,
    UInt32Type,
    Int64Type,
    UInt64Type,
    StructType,
    UnionType,
  };

  export { BoolType as bool };
  export { CharType as char };
  export { UCharType as uchar };
  export { ShortType as short };
  export { UShortType as ushort };
  export { IntType as int };
  export { UIntType as uint };
  export { LongType as long };
  export { ULongType as ulong };
  export { LongLongType as longlong };
  export { ULongLongType as ulonglong };
  export { FloatType as float };
  export { DoubleType as double };
  export { SizeType as size_t };
  export { SSizeType as ssize_t };

  export { Int8Type as int8_t };
  export { UInt8Type as uint8_t };
  export { Int16Type as int16_t };
  export { UInt16Type as uint16_t };
  export { Int32Type as int32_t };
  export { UInt32Type as uint32_t };
  export { Int64Type as int64_t };
  export { UInt64Type as uint64_t };

  export { StructType as struct };
  export { UnionType as union };

  export { BaseArrayType as array };
}
