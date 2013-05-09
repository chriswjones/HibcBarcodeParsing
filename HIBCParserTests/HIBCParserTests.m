//
//  HIBCTests.m
//  HIBCTests
//
//  Created by Chris Jones on 5/8/13.
//  Copyright (c) 2013 Chris Jones. All rights reserved.
//

#import "HIBCParserTests.h"
#import "HIBC.h"

@implementation HIBCParserTests {
    NSCalendar *_gregorian;
    NSString *_linkChar;
    NSString *_checkChar;
    NSString *_lot;
    NSString *_serial;
    int _twoDigitQty;
    int _fiveDigitQty;
}

- (void)setUp {
    [super setUp];

    // Load up predefined values for all tests from the HIBC documentation

    _gregorian = [[NSCalendar alloc] initWithCalendarIdentifier:NSGregorianCalendar];
    _linkChar = @"L";
    _checkChar = @"C";
    _lot = @"3C001";
    _serial = @"0001";
    _twoDigitQty = 24;
    _fiveDigitQty = 100;
}

- (void)tearDown {
    _gregorian = nil;
    _linkChar = nil;
    _checkChar = nil;
    _lot = nil;
    _serial = nil;

    [super tearDown];
}

- (void)testSlashCheckDigit {

    // Primary Barcode
    HIBC *hibc = [HIBC decode:@"+H124009993020351/"];
    NSAssert([@"H124" isEqualToString:hibc.labelerIDCode], @"Labeler ID Code");
    NSAssert([@"00999302035" isEqualToString:hibc.productNumber], @"Product Number");
    NSAssert(1 == hibc.unitOfMeasure, @"Unit of Measure");
    NSAssert([@"/" isEqualToString:hibc.checkCharacter], @"Check Character");

    // Secondary Barcode
    hibc = [HIBC decode:@"+$$09053C001L/"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([@"/" isEqualToString:hibc.checkCharacter], @"Check Character");

    // Concatenated barcode
    hibc = [HIBC decode:@"+H124009993019351/1715160668893E07/"];
    NSAssert([@"H124" isEqualToString:hibc.labelerIDCode], @"Labeler ID Code");
    NSAssert([@"00999301935" isEqualToString:hibc.productNumber], @"Product Number");
    NSAssert(1 == hibc.unitOfMeasure, @"Unit of Measure");
    NSAssert([@"60668893E07" isEqualToString:hibc.lot], @"Lot");
    NSAssert([@"/" isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)testSlashLinkCharacter {
    HIBC *hibc = [HIBC decode:@"+$$09053C001/C"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([@"/" isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)testSlashLinkAndCheckCharacter {
    HIBC *hibc = [HIBC decode:@"+$$09053C001//"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([@"/" isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([@"/" isEqualToString:hibc.checkCharacter], @"Check Character");
}

/*
    Tests from HIBC documentation lot/serial examples
    These sufficiently test Secondary Barcodes
 */

- (void)test01 {
    HIBC *hibc = [HIBC decode:@"+05271LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test02 {
    HIBC *hibc = [HIBC decode:@"+$3C001LC"];
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test03 {
    HIBC *hibc = [HIBC decode:@"+$$09053C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test04 {
    HIBC *hibc = [HIBC decode:@"+$$20928053C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test05 {
    HIBC *hibc = [HIBC decode:@"+$$30509283C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test06 {
    HIBC *hibc = [HIBC decode:@"+$$4050928223C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    dateComponents.hour = 22;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test07 {
    HIBC *hibc = [HIBC decode:@"+$$5052713C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test08 {
    HIBC *hibc = [HIBC decode:@"+$$605271223C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    dateComponents.hour = 22;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test09 {
    HIBC *hibc = [HIBC decode:@"+$$73C001LC"];

    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test10 {
    HIBC *hibc = [HIBC decode:@"+$$82409053C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test11 {
    HIBC *hibc = [HIBC decode:@"+$$82420928053C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test12 {
    HIBC *hibc = [HIBC decode:@"+$$82430509283C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test13 {
    HIBC *hibc = [HIBC decode:@"+$$8244050928223C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    dateComponents.hour = 22;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test14 {
    HIBC *hibc = [HIBC decode:@"+$$8245052713C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test15 {
    HIBC *hibc = [HIBC decode:@"+$$824605271223C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    dateComponents.hour = 22;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test16 {
    HIBC *hibc = [HIBC decode:@"+$$82473C001LC"];

    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test17 {
    HIBC *hibc = [HIBC decode:@"+$$824LC"];

    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_twoDigitQty == hibc.quantity, @"2 Digit Quantity");
}

- (void)test18 {
    HIBC *hibc = [HIBC decode:@"+$$90010009053C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test19 {
    HIBC *hibc = [HIBC decode:@"+$$90010020928053C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test20 {
    HIBC *hibc = [HIBC decode:@"+$$90010030509283C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test21 {
    HIBC *hibc = [HIBC decode:@"+$$9001004050928223C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    dateComponents.hour = 22;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test22 {
    HIBC *hibc = [HIBC decode:@"+$$9001005052713C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test23 {
    HIBC *hibc = [HIBC decode:@"+$$900100605271223C001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.hour = 22;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test24 {
    HIBC *hibc = [HIBC decode:@"+$$90010073C001LC"];

    NSAssert([_lot isEqualToString:hibc.lot], @"Lot");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test25 {
    HIBC *hibc = [HIBC decode:@"+$$900100LC"];

    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
    NSAssert(_fiveDigitQty == hibc.quantity, @"5 Digit Quantity");
}

- (void)test26 {
    HIBC *hibc = [HIBC decode:@"+$+0001LC"];

    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test27 {
    HIBC *hibc = [HIBC decode:@"+$$+09050001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

- (void)test28 {
    HIBC *hibc = [HIBC decode:@"+$$+20928050001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}


- (void)test29 {
    HIBC *hibc = [HIBC decode:@"+$$+30509280001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}


- (void)test30 {
    HIBC *hibc = [HIBC decode:@"+$$+4050928200001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.hour = 20;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}


- (void)test31 {
    HIBC *hibc = [HIBC decode:@"+$$+5052710001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}


- (void)test32 {
    HIBC *hibc = [HIBC decode:@"+$$+605271200001LC"];

    NSDateComponents *dateComponents = [[NSDateComponents alloc] init];
    dateComponents.month = 9;
    dateComponents.day = 28;
    dateComponents.hour = 20;
    dateComponents.year = 2005;
    NSDate *expDate = [_gregorian dateFromComponents:dateComponents];

    NSAssert([expDate isEqualToDate:hibc.expirationDate], @"Expiration Date");
    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}


- (void)test33 {
    HIBC *hibc = [HIBC decode:@"+$$+70001LC"];

    NSAssert([_serial isEqualToString:hibc.serial], @"Serial");
    NSAssert([_linkChar isEqualToString:hibc.linkCharacter], @"Link Character");
    NSAssert([_checkChar isEqualToString:hibc.checkCharacter], @"Check Character");
}

/*
    Concatenated Barcode Tests
 */

@end
