//TODO
//These expressions must be reducible to a constant at compile-time.
/*
    dcl a fixed bin static nonassignable init(0);
    dcl m fixed bin value( a );       //not constant
    dcl n fixed bin static init( a ); //not constant
*/
//for each VALUE, VALUELIST, VALUERANGE, and STATIC INITIAL
//check if all expressions are constant
//if not, throw error "VALUE, VALUELIST, VALUERANGE, and STATIC INITIAL expressions must be constant."