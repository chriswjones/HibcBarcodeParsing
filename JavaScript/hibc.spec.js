describe('HIBC Decoder', function () {

    var dateWithMonthYear = moment("092005", "MMYYYY");
    var dateWithDayMonthYear = moment("09-28-2005", "MM-DD-YYYY");
    var dateWithHourDayMonthYear = moment("09-28-2005 22", "MM-DD-YYYY HH");
    var lot = "3C001";
    var serial = "0001";
    var check = "C";
    var link = "L";
    var twoDigitQty = 24;
    var fiveDigitQuantity = 100;
    var labelerId = "Z999";
    var product = "00999302035";
    var uom = 1;


    it('should handle barcodes with spaces as check and link characters', function () {
        var line1 = HIBC.decode("+Z999009993020351 ");
        expect(line1.type).toEqual(HIBC.type.Line1);
        expect(line1.labelerId).toEqual(labelerId);
        expect(line1.product).toEqual(product);
        expect(line1.uom).toEqual(uom);
        expect(line1.check).toEqual(" ");

        var invalidLine2 = HIBC.decode("+$$09053C001 C");
        expect(invalidLine2.type).toEqual(HIBC.type.Line2);
        expect(invalidLine2.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(invalidLine2.lot).toEqual(lot);
        expect(invalidLine2.link).toEqual(" ");
        expect(invalidLine2.check).toEqual(check);

        var validLine2 = HIBC.decode("+$$09053C001  ");
        expect(validLine2.type).toEqual(HIBC.type.Line2);
        expect(validLine2.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(validLine2.lot).toEqual(lot);
        expect(validLine2.link).toEqual(" ");
        expect(validLine2.check).toEqual(" ");

        expect(HIBC.isMatch(line1, invalidLine2)).toBeTruthy();
        expect(HIBC.isMatch(line1, validLine2)).toBeTruthy();
    });

    it('should handle barcodes with leading and trailing *', function () {
        var decoded = HIBC.decode("*+Z999009993020351/05271C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/05271C*");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("*+Z999009993020351/05271C*");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.check).toEqual(check);
    });

    it('should check for line 1 and line 2 linking and handle / in check and link characters', function () {
        var line1 = HIBC.decode("+Z999009993020351/");
        expect(line1.type).toEqual(HIBC.type.Line1);
        expect(line1.labelerId).toEqual(labelerId);
        expect(line1.product).toEqual(product);
        expect(line1.uom).toEqual(uom);
        expect(line1.check).toEqual("/");

        var invalidLine2 = HIBC.decode("+$$09053C001L/");
        expect(invalidLine2.type).toEqual(HIBC.type.Line2);
        expect(invalidLine2.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(invalidLine2.lot).toEqual(lot);
        expect(invalidLine2.link).toEqual("L");
        expect(invalidLine2.check).toEqual("/");

        var validLine2 = HIBC.decode("+$$09053C001//");
        expect(validLine2.type).toEqual(HIBC.type.Line2);
        expect(validLine2.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(validLine2.lot).toEqual(lot);
        expect(validLine2.link).toEqual("/");
        expect(validLine2.check).toEqual("/");

        expect(HIBC.isMatch(line1, invalidLine2)).toBeFalsy();
        expect(HIBC.isMatch(line1, validLine2)).toBeTruthy();
    });

    it('should handle concatenated barcodes', function () {

        var decoded = HIBC.decode("+Z999009993020351/05271C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$3C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$09053C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$20928053C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$30509283C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$4050928223C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$5052713C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$605271223C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$73C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$82409053C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$82420928053C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$82430509283C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$8244050928223C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$8245052713C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$824605271223C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$82473C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$824C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(_.isEmpty(decoded.lot)).toBeTruthy();
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(twoDigitQty);

        decoded = HIBC.decode("+Z999009993020351/$$90010009053C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$90010020928053C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$90010030509283C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$9001004050928223C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$9001005052713C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$900100605271223C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$90010073C001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(decoded.lot).toEqual(lot);
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$$900100C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(_.isEmpty(decoded.lot)).toBeTruthy();
        expect(decoded.check).toEqual(check);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);

        decoded = HIBC.decode("+Z999009993020351/$+0001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$+09050001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$+20928050001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$+30509280001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        // original barcode from HIBC has incorrect hours
        decoded = HIBC.decode("+Z999009993020351/$$+4050928200001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(-2);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$+5052710001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        // original barcode from HIBC has incorrect hours
        decoded = HIBC.decode("+Z999009993020351/$$+605271200001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(-2);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);

        decoded = HIBC.decode("+Z999009993020351/$$+70001C");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Concatenated);
        expect(decoded.labelerId).toEqual(labelerId);
        expect(decoded.product).toEqual(product);
        expect(decoded.uom).toEqual(uom);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
        expect(decoded.serial).toEqual(serial);
        expect(decoded.check).toEqual(check);
    });

    it('should pass all of the example data from HIBC documentation', function () {

        var decoded = HIBC.decode("+05271LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$3C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);

        decoded = HIBC.decode("+$$09053C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);

        decoded = HIBC.decode("+$$20928053C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$30509283C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$4050928223C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);

        decoded = HIBC.decode("+$$5052713C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$605271223C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);

        decoded = HIBC.decode("+$$73C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(_.isUndefined(decoded.date)).toBeTruthy();

        decoded = HIBC.decode("+$$82409053C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);

        decoded = HIBC.decode("+$$82420928053C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$82430509283C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$8244050928223C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);

        decoded = HIBC.decode("+$$8245052713C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$824605271223C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);

        decoded = HIBC.decode("+$$82473C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(_.isUndefined(decoded.date)).toBeTruthy();

        decoded = HIBC.decode("+$$824LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(_.isEmpty(decoded.lot)).toBeTruthy();
        expect(decoded.quantity).toEqual(twoDigitQty);
        expect(_.isUndefined(decoded.date)).toBeTruthy();

        decoded = HIBC.decode("+$$90010009053C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);

        decoded = HIBC.decode("+$$90010020928053C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$90010030509283C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$9001004050928223C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);

        decoded = HIBC.decode("+$$9001005052713C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$900100605271223C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(0);

        decoded = HIBC.decode("+$$90010073C001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.lot).toEqual(lot);
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(_.isUndefined(decoded.date)).toBeTruthy();

        decoded = HIBC.decode("+$$900100LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(_.isEmpty(decoded.lot)).toBeTruthy();
        expect(decoded.quantity).toEqual(fiveDigitQuantity);
        expect(_.isUndefined(decoded.date)).toBeTruthy();

        decoded = HIBC.decode("+$+0001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(_.isUndefined(decoded.date)).toBeTruthy();

        decoded = HIBC.decode("+$$+09050001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.date.diff(dateWithMonthYear, "months")).toEqual(0);

        decoded = HIBC.decode("+$$+20928050001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        decoded = HIBC.decode("+$$+30509280001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        // original barcode from HIBC has incorrect hours
        decoded = HIBC.decode("+$$+4050928200001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(-2);

        decoded = HIBC.decode("+$$+5052710001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.date.diff(dateWithDayMonthYear, "days")).toEqual(0);

        // original barcode from HIBC has incorrect hours
        decoded = HIBC.decode("+$$+605271200001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(decoded.date.diff(dateWithHourDayMonthYear, "hours")).toEqual(-2);

        decoded = HIBC.decode("+$$+70001LC");
        expect(decoded.error).toBeFalsy();
        expect(decoded.type).toEqual(HIBC.type.Line2);
        expect(decoded.link).toEqual(link);
        expect(decoded.check).toEqual(check);
        expect(decoded.serial).toEqual(serial);
        expect(_.isUndefined(decoded.date)).toBeTruthy();
    });
});