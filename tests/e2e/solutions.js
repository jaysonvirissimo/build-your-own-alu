// Verified-correct HDL solutions for chips the smoke suite needs to seed as
// already-solved. Each entry was validated against the real parser+simulator
// before being committed.
export const SOLUTIONS = {
  not: `CHIP Not {
    IN in;
    OUT out;
    PARTS:
    Nand(a=in, b=in, out=out);
}`,
  and: `CHIP And {
    IN a, b;
    OUT out;
    PARTS:
    Nand(a=a, b=b, out=w);
    Nand(a=w, b=w, out=out);
}`,
  or: `CHIP Or {
    IN a, b;
    OUT out;
    PARTS:
    Nand(a=a, b=a, out=na);
    Nand(a=b, b=b, out=nb);
    Nand(a=na, b=nb, out=out);
}`,
  xor: `CHIP Xor {
    IN a, b;
    OUT out;
    PARTS:
    Nand(a=a, b=b, out=nab);
    Nand(a=a, b=nab, out=x);
    Nand(a=b, b=nab, out=y);
    Nand(a=x, b=y, out=out);
}`,
  mux: `CHIP Mux {
    IN a, b, sel;
    OUT out;
    PARTS:
    Nand(a=sel, b=sel, out=nsel);
    Nand(a=a, b=nsel, out=x);
    Nand(a=b, b=sel, out=y);
    Nand(a=x, b=y, out=out);
}`,
  dmux: `CHIP DMux {
    IN in, sel;
    OUT a, b;
    PARTS:
    Nand(a=sel, b=sel, out=nsel);
    Nand(a=in, b=nsel, out=na);
    Nand(a=na, b=na, out=a);
    Nand(a=in, b=sel, out=nb);
    Nand(a=nb, b=nb, out=b);
}`,
  not16: `CHIP Not16 {
    IN in[16];
    OUT out[16];
    PARTS:
    Not(in=in[0], out=out[0]);
    Not(in=in[1], out=out[1]);
    Not(in=in[2], out=out[2]);
    Not(in=in[3], out=out[3]);
    Not(in=in[4], out=out[4]);
    Not(in=in[5], out=out[5]);
    Not(in=in[6], out=out[6]);
    Not(in=in[7], out=out[7]);
    Not(in=in[8], out=out[8]);
    Not(in=in[9], out=out[9]);
    Not(in=in[10], out=out[10]);
    Not(in=in[11], out=out[11]);
    Not(in=in[12], out=out[12]);
    Not(in=in[13], out=out[13]);
    Not(in=in[14], out=out[14]);
    Not(in=in[15], out=out[15]);
}`,
};
