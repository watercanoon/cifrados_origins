import java.util.*;

public class FindAlberti {
    public static void main(String[] args) {
        String outer = "ABCDEFGILMNOPQRSTVXZ1234";
        String pt1 = "SIFVERAPRECISODECIRSIDILOCONVALOR"; // 33 chars
        String ct1 = "zclxcxhztmkpetgpfu&vlhsyskitiafaik"; // 34 chars

        // Candidate alphabets
        String[] candidates = {
            "&xysomqihfdbacegklnprtvz",
            "acegklnprtvz&xysomqibfdh",
            "dlgarenbosfchtyqixkvpztm",
            "aocdefghiklmnprstvxzy&qb",
            "cdefghiklmnoprstvxz&ayqb",
            "klnprtvz&xysomqihfdbaceg",
            "cdefghijklmnñopqrstuvwxyzab",
        };

        for (String cand : candidates) {
            if (cand.length() == 23) cand += "n";
            if (cand.length() != 24) continue;

            int idxB = cand.indexOf('b');
            if (idxB == -1) continue;

            // Let's test if there is a direction, shift, and maybe a padding in pt1
            for (int direction : new int[]{1, -1}) {
                for (int shiftAmount : new int[]{3, -3, 5, -5}) {
                    
                    // Since pt1 has 33 chars and ct1 has 34 chars, let's try inserting a character in pt1
                    // or checking if the last block had a different padding
                    for (int padPos = 0; padPos <= pt1.length(); padPos++) {
                        for (char padChar : "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234".toCharArray()) {
                            String ptTemp = pt1.substring(0, padPos) + padChar + pt1.substring(padPos);
                            
                            // Check if this ptTemp maps to ct1
                            boolean consistent = true;
                            for (int i = 0; i < ptTemp.length(); i++) {
                                char p = ptTemp.charAt(i);
                                char c = ct1.charAt(i);
                                int outerIdx = outer.indexOf(p);
                                if (outerIdx == -1) {
                                    consistent = false;
                                    break;
                                }
                                int block = i / 4;
                                int innerIdx = (idxB + block * shiftAmount + direction * (outerIdx - 9) + 24 * 1000) % 24;
                                if (cand.charAt(innerIdx) != c) {
                                    consistent = false;
                                    break;
                                }
                            }
                            if (consistent) {
                                System.out.println("=== SOLUTION FOUND FOR EXAMPLE 1 ===");
                                System.out.println("Candidate: " + cand);
                                System.out.println("Direction: " + direction);
                                System.out.println("Shift: " + shiftAmount);
                                System.out.println("Padded Plaintext: " + ptTemp);
                                return;
                            }
                        }
                    }
                }
            }
        }
        System.out.println("No solution found.");
    }
}
